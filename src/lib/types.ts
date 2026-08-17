export type PlayerSlug = "player_1" | "player_2";

/** Result of asking OverFast for a player's competitive stats summary. */
export type CompetitiveStatsResult =
  | { status: "ok"; gamesPlayed: number; gamesWon: number; payload: unknown }
  | { status: "private" }
  | { status: "not_found" }
  | { status: "error"; message: string };

/** Per-player fetch/processing outcome for a single poll run, for sync_log. */
export type PlayerPollStatus =
  | "ok"
  | "season_reset"
  | "no_change"
  | "private"
  | "not_found"
  | "error";

export interface PlayerConfig {
  slug: PlayerSlug;
  battleTag: string;
  displayName: string;
}

export interface PlayerRow {
  slug: PlayerSlug;
  battletag: string;
  display_name: string;
}

export interface SnapshotRow {
  id: number;
  player_slug: PlayerSlug;
  games_played: number;
  games_won: number;
  taken_at: string;
}

export interface MatchRow {
  id: number;
  window_start: string;
  window_end: string;
  games_delta: number;
  wins_delta: number;
  losses_delta: number;
}

export interface SyncLogRow {
  id: number;
  run_at: string;
  success: boolean;
  player_1_status: PlayerPollStatus;
  player_2_status: PlayerPollStatus;
  message: string | null;
}
