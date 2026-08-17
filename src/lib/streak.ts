import type { MatchRow } from "./types";

export interface Streak {
  type: "win" | "loss" | "none";
  length: number;
}

/**
 * Computes the current win/loss streak from match rows.
 *
 * `rows` must be ordered most-recent-first (by window_end DESC).
 *
 * Because OverFast only gives us cumulative deltas per poll window (not
 * per-game results), a window that mixes wins and losses can't be ordered
 * internally. A "pure" window (all wins or all losses) extends the streak
 * by its games_delta; the first mixed window we hit ends the streak, since
 * we can't tell whether the most recent game in it was a win or a loss.
 */
export function computeCurrentStreak(rows: MatchRow[]): Streak {
  if (rows.length === 0) {
    return { type: "none", length: 0 };
  }

  let type: "win" | "loss" | null = null;
  let length = 0;

  for (const row of rows) {
    const isPureWin = row.wins_delta === row.games_delta;
    const isPureLoss = row.losses_delta === row.games_delta;

    if (!isPureWin && !isPureLoss) {
      // Mixed window: ambiguous internal order, stop here.
      break;
    }

    const rowType: "win" | "loss" = isPureWin ? "win" : "loss";

    if (type === null) {
      type = rowType;
    } else if (rowType !== type) {
      break;
    }

    length += row.games_delta;
  }

  return type ? { type, length } : { type: "none", length: 0 };
}
