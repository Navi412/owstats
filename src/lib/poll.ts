import { sql } from "./db";
import { toDate } from "./dates";
import { env } from "./env";
import { fetchCompetitiveStats } from "./overfast";
import type { PlayerConfig, PlayerPollStatus, PlayerSlug, SnapshotRow } from "./types";

interface PlayerOutcome {
  status: PlayerPollStatus;
  message?: string;
}

async function processPlayer(config: PlayerConfig, now: Date): Promise<PlayerOutcome> {
  const result = await fetchCompetitiveStats(config.battleTag);

  if (result.status === "private") return { status: "private" };
  if (result.status === "not_found") return { status: "not_found" };
  if (result.status === "error") return { status: "error", message: result.message };

  const { gamesPlayed, gamesWon, payload } = result;

  const previousRows = (await sql`
    SELECT id, games_played, games_won, taken_at
    FROM snapshots
    WHERE player_slug = ${config.slug}
    ORDER BY taken_at DESC
    LIMIT 1
  `) as unknown as SnapshotRow[];
  const previous = previousRows[0];

  // Case: first snapshot ever for this player -> baseline only, no delta.
  if (!previous) {
    const inserted = (await sql`
      INSERT INTO snapshots (player_slug, games_played, games_won, payload, taken_at)
      VALUES (${config.slug}, ${gamesPlayed}, ${gamesWon}, ${JSON.stringify(payload)}, ${now.toISOString()})
      RETURNING id
    `) as unknown as { id: number }[];
    await sql`UPDATE players SET counted_through_snapshot_id = ${inserted[0].id} WHERE slug = ${config.slug}`;
    return { status: "ok" };
  }

  // Case: identical to the previous snapshot -> nothing to record.
  if (gamesPlayed === previous.games_played && gamesWon === previous.games_won) {
    return { status: "no_change" };
  }

  // Case: games_played went down -> season reset. Rebase, don't count matches,
  // and move this player's counted-through pointer up so a stale pre-reset
  // baseline can't block future matches from ever being detected again.
  if (gamesPlayed < previous.games_played) {
    const inserted = (await sql`
      INSERT INTO snapshots (player_slug, games_played, games_won, payload, taken_at)
      VALUES (${config.slug}, ${gamesPlayed}, ${gamesWon}, ${JSON.stringify(payload)}, ${now.toISOString()})
      RETURNING id
    `) as unknown as { id: number }[];
    await sql`UPDATE players SET counted_through_snapshot_id = ${inserted[0].id} WHERE slug = ${config.slug}`;
    return { status: "season_reset" };
  }

  // Normal case: games_played increased since the last snapshot. Just record
  // it — whether it pairs up with the other player into a match is decided
  // separately in tryRecordMatch, which looks across all polls rather than
  // requiring both players to move in this exact same one.
  await sql`
    INSERT INTO snapshots (player_slug, games_played, games_won, payload, taken_at)
    VALUES (${config.slug}, ${gamesPlayed}, ${gamesWon}, ${JSON.stringify(payload)}, ${now.toISOString()})
  `;
  return { status: "ok" };
}

interface PlayerSnapshotInfo {
  snapshotId: number;
  gamesPlayed: number;
  gamesWon: number;
  takenAt: Date | string;
}

async function getLatestSnapshot(slug: PlayerSlug): Promise<PlayerSnapshotInfo | null> {
  const rows = (await sql`
    SELECT id, games_played, games_won, taken_at
    FROM snapshots
    WHERE player_slug = ${slug}
    ORDER BY taken_at DESC
    LIMIT 1
  `) as unknown as SnapshotRow[];
  const r = rows[0];
  if (!r) return null;
  return { snapshotId: Number(r.id), gamesPlayed: r.games_played, gamesWon: r.games_won, takenAt: r.taken_at };
}

/**
 * Looks for a new match by comparing each player's latest snapshot against
 * the snapshot they were last "counted through" (players.counted_through_snapshot_id),
 * rather than requiring both players' games_played to move within the same
 * poll. Polls land at irregular, independent times (GitHub Actions cron
 * jitter, manual refreshes, OverFast's own cache), so pairing on a single
 * poll call almost never fires even when both players clearly played
 * together — this instead accumulates each player's un-counted progress
 * until both sides have some, then reconciles.
 */
async function tryRecordMatch(now: Date): Promise<boolean> {
  const baselineRows = (await sql`
    SELECT p.slug, s.id, s.games_played, s.games_won, s.taken_at
    FROM players p
    JOIN snapshots s ON s.id = p.counted_through_snapshot_id
    WHERE p.slug IN ('player_1', 'player_2')
  `) as unknown as (SnapshotRow & { slug: PlayerSlug })[];

  const baseline1 = baselineRows.find((r) => r.slug === "player_1");
  const baseline2 = baselineRows.find((r) => r.slug === "player_2");
  if (!baseline1 || !baseline2) return false;

  const [latest1, latest2] = await Promise.all([
    getLatestSnapshot("player_1"),
    getLatestSnapshot("player_2"),
  ]);
  if (!latest1 || !latest2) return false;

  const gamesDelta1 = latest1.gamesPlayed - baseline1.games_played;
  const gamesDelta2 = latest2.gamesPlayed - baseline2.games_played;
  if (gamesDelta1 <= 0 || gamesDelta2 <= 0) return false;

  const gamesDelta = Math.min(gamesDelta1, gamesDelta2);
  let winsDelta = Math.min(
    latest1.gamesWon - baseline1.games_won,
    latest2.gamesWon - baseline2.games_won
  );
  // Defensive clamp in case the two counters are ever inconsistent.
  if (winsDelta < 0) winsDelta = 0;
  if (winsDelta > gamesDelta) winsDelta = gamesDelta;
  const lossesDelta = gamesDelta - winsDelta;

  const windowStart = new Date(
    Math.min(toDate(baseline1.taken_at).getTime(), toDate(baseline2.taken_at).getTime())
  );

  await sql`
    INSERT INTO matches (
      window_start, window_end, games_delta, wins_delta, losses_delta,
      player_1_snapshot_id, player_2_snapshot_id
    )
    VALUES (
      ${windowStart.toISOString()}, ${now.toISOString()}, ${gamesDelta}, ${winsDelta}, ${lossesDelta},
      ${latest1.snapshotId}, ${latest2.snapshotId}
    )
  `;

  await sql`UPDATE players SET counted_through_snapshot_id = ${latest1.snapshotId} WHERE slug = 'player_1'`;
  await sql`UPDATE players SET counted_through_snapshot_id = ${latest2.snapshotId} WHERE slug = 'player_2'`;

  return true;
}

const UNHEALTHY_STATUSES: PlayerPollStatus[] = ["private", "not_found", "error"];

export async function runPoll() {
  const now = new Date();

  const players: PlayerConfig[] = [
    { slug: "player_1", battleTag: env.player1BattleTag, displayName: env.player1Label },
    { slug: "player_2", battleTag: env.player2BattleTag, displayName: env.player2Label },
  ];

  for (const p of players) {
    await sql`
      INSERT INTO players (slug, battletag, display_name, updated_at)
      VALUES (${p.slug}, ${p.battleTag}, ${p.displayName}, now())
      ON CONFLICT (slug) DO UPDATE
      SET battletag = EXCLUDED.battletag, display_name = EXCLUDED.display_name, updated_at = now()
    `;
  }

  const [p1, p2] = await Promise.all([
    processPlayer(players[0], now),
    processPlayer(players[1], now),
  ]);

  const matchRecorded = await tryRecordMatch(now);

  const success = !UNHEALTHY_STATUSES.includes(p1.status) && !UNHEALTHY_STATUSES.includes(p2.status);
  const message = [p1.message, p2.message].filter(Boolean).join(" | ") || null;

  await sql`
    INSERT INTO sync_log (run_at, success, player_1_status, player_2_status, message)
    VALUES (${now.toISOString()}, ${success}, ${p1.status}, ${p2.status}, ${message})
  `;

  return {
    ranAt: now.toISOString(),
    success,
    matchRecorded,
    player1: { battleTag: players[0].battleTag, status: p1.status, message: p1.message ?? null },
    player2: { battleTag: players[1].battleTag, status: p2.status, message: p2.message ?? null },
  };
}
