import { sql } from "./db";
import { toDate } from "./dates";
import { env } from "./env";
import { fetchCompetitiveStats } from "./overfast";
import type { PlayerConfig, PlayerPollStatus, SnapshotRow } from "./types";

interface PlayerDelta {
  gamesPlayedDelta: number;
  gamesWonDelta: number;
  previousTakenAt: Date | string;
  snapshotId: number;
}

interface PlayerOutcome {
  status: PlayerPollStatus;
  message?: string;
  delta?: PlayerDelta;
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
    await sql`
      INSERT INTO snapshots (player_slug, games_played, games_won, payload, taken_at)
      VALUES (${config.slug}, ${gamesPlayed}, ${gamesWon}, ${JSON.stringify(payload)}, ${now.toISOString()})
    `;
    return { status: "ok" };
  }

  // Case: identical to the previous snapshot -> nothing to record.
  if (gamesPlayed === previous.games_played && gamesWon === previous.games_won) {
    return { status: "no_change" };
  }

  // Case: games_played went down -> season reset. Rebase, don't count matches.
  if (gamesPlayed < previous.games_played) {
    await sql`
      INSERT INTO snapshots (player_slug, games_played, games_won, payload, taken_at)
      VALUES (${config.slug}, ${gamesPlayed}, ${gamesWon}, ${JSON.stringify(payload)}, ${now.toISOString()})
    `;
    return { status: "season_reset" };
  }

  // Normal case: games_played increased since the last snapshot.
  const insertedRows = (await sql`
    INSERT INTO snapshots (player_slug, games_played, games_won, payload, taken_at)
    VALUES (${config.slug}, ${gamesPlayed}, ${gamesWon}, ${JSON.stringify(payload)}, ${now.toISOString()})
    RETURNING id
  `) as unknown as { id: number }[];

  const gamesPlayedDelta = gamesPlayed - previous.games_played;
  let gamesWonDelta = gamesWon - previous.games_won;
  // Defensive clamp in case the two counters are ever inconsistent.
  if (gamesWonDelta < 0) gamesWonDelta = 0;
  if (gamesWonDelta > gamesPlayedDelta) gamesWonDelta = gamesPlayedDelta;

  return {
    status: "ok",
    delta: {
      gamesPlayedDelta,
      gamesWonDelta,
      previousTakenAt: previous.taken_at,
      snapshotId: insertedRows[0].id,
    },
  };
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

  let matchRecorded = false;

  // Only count matches when BOTH players show a genuine positive delta in
  // the same window -> strong signal they played together.
  if (p1.delta && p2.delta) {
    const gamesDelta = Math.min(p1.delta.gamesPlayedDelta, p2.delta.gamesPlayedDelta);
    if (gamesDelta > 0) {
      let winsDelta = Math.min(p1.delta.gamesWonDelta, p2.delta.gamesWonDelta);
      if (winsDelta > gamesDelta) winsDelta = gamesDelta;
      const lossesDelta = gamesDelta - winsDelta;

      const windowStart = new Date(
        Math.min(
          toDate(p1.delta.previousTakenAt).getTime(),
          toDate(p2.delta.previousTakenAt).getTime()
        )
      );

      await sql`
        INSERT INTO matches (
          window_start, window_end, games_delta, wins_delta, losses_delta,
          player_1_snapshot_id, player_2_snapshot_id
        )
        VALUES (
          ${windowStart.toISOString()}, ${now.toISOString()}, ${gamesDelta}, ${winsDelta}, ${lossesDelta},
          ${p1.delta.snapshotId}, ${p2.delta.snapshotId}
        )
      `;
      matchRecorded = true;
    }
  }

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
