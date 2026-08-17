import { sql } from "./db";
import type { MatchRow, SyncLogRow } from "./types";

export interface ScoreboardTotals {
  wins: number;
  losses: number;
  gamesPlayed: number;
  winrate: number | null;
}

export async function getScoreboardTotals(): Promise<ScoreboardTotals> {
  const rows = (await sql`
    SELECT
      COALESCE(SUM(wins_delta), 0)::int AS wins,
      COALESCE(SUM(losses_delta), 0)::int AS losses
    FROM matches
  `) as unknown as { wins: number; losses: number }[];

  const { wins, losses } = rows[0] ?? { wins: 0, losses: 0 };
  const gamesPlayed = wins + losses;

  return {
    wins,
    losses,
    gamesPlayed,
    winrate: gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : null,
  };
}

export interface DailyWinrate {
  day: string; // YYYY-MM-DD
  wins: number;
  losses: number;
  games: number;
  winrate: number;
}

export async function getDailyWinrate(days = 30): Promise<DailyWinrate[]> {
  const rows = (await sql`
    SELECT
      (window_end AT TIME ZONE 'UTC')::date AS day,
      SUM(wins_delta)::int AS wins,
      SUM(losses_delta)::int AS losses
    FROM matches
    WHERE window_end >= now() - (${days} || ' days')::interval
    GROUP BY 1
    ORDER BY 1 ASC
  `) as unknown as { day: string; wins: number; losses: number }[];

  return rows.map((r) => {
    const games = r.wins + r.losses;
    return {
      day: r.day,
      wins: r.wins,
      losses: r.losses,
      games,
      winrate: games > 0 ? (r.wins / games) * 100 : 0,
    };
  });
}

/** Most recent match windows, newest first — used to derive the current streak. */
export async function getRecentMatchRows(limit = 100): Promise<MatchRow[]> {
  return (await sql`
    SELECT id, window_start, window_end, games_delta, wins_delta, losses_delta
    FROM matches
    ORDER BY window_end DESC
    LIMIT ${limit}
  `) as unknown as MatchRow[];
}

export interface SessionDay {
  day: string;
  wins: number;
  losses: number;
  games: number;
  windows: { windowStart: string; windowEnd: string; wins: number; losses: number; games: number }[];
}

export async function getRecentSessions(days = 14): Promise<SessionDay[]> {
  const rows = (await sql`
    SELECT window_start, window_end, games_delta, wins_delta, losses_delta
    FROM matches
    WHERE window_end >= now() - (${days} || ' days')::interval
    ORDER BY window_end DESC
  `) as unknown as {
    window_start: string;
    window_end: string;
    games_delta: number;
    wins_delta: number;
    losses_delta: number;
  }[];

  const byDay = new Map<string, SessionDay>();

  for (const row of rows) {
    const day = row.window_end.slice(0, 10);
    let entry = byDay.get(day);
    if (!entry) {
      entry = { day, wins: 0, losses: 0, games: 0, windows: [] };
      byDay.set(day, entry);
    }
    entry.wins += row.wins_delta;
    entry.losses += row.losses_delta;
    entry.games += row.games_delta;
    entry.windows.push({
      windowStart: row.window_start,
      windowEnd: row.window_end,
      wins: row.wins_delta,
      losses: row.losses_delta,
      games: row.games_delta,
    });
  }

  return [...byDay.values()];
}

export interface SyncStatus {
  lastSuccessful: SyncLogRow | null;
  lastRun: SyncLogRow | null;
}

export async function getSyncStatus(): Promise<SyncStatus> {
  const [lastSuccessfulRows, lastRunRows] = await Promise.all([
    sql`
      SELECT id, run_at, success, player_1_status, player_2_status, message
      FROM sync_log
      WHERE success
      ORDER BY run_at DESC
      LIMIT 1
    `,
    sql`
      SELECT id, run_at, success, player_1_status, player_2_status, message
      FROM sync_log
      ORDER BY run_at DESC
      LIMIT 1
    `,
  ]);

  const lastSuccessful = (lastSuccessfulRows as unknown as SyncLogRow[])[0] ?? null;
  const lastRun = (lastRunRows as unknown as SyncLogRow[])[0] ?? null;

  return { lastSuccessful, lastRun };
}

export interface PlayerInfo {
  slug: string;
  battletag: string;
  display_name: string;
}

export async function getPlayers(): Promise<PlayerInfo[]> {
  return (await sql`
    SELECT slug, battletag, display_name FROM players ORDER BY slug
  `) as unknown as PlayerInfo[];
}
