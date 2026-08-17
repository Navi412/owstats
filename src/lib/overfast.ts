import type { CompetitiveStatsResult } from "./types";

const OVERFAST_BASE_URL = "https://overfast-api.tekrop.fr";

/**
 * Fetches a player's competitive stats summary from OverFast API.
 *
 * Endpoint verified against https://overfast-api.tekrop.fr/openapi.json:
 * GET /players/{player_id}/stats/summary?gamemode=competitive
 * -> PlayerStatsSummary { general: StatsSummary | null, roles, heroes }
 * StatsSummary.general is null when the player's career is private.
 * The API itself caches this endpoint for 10 minutes, so polling more
 * often than that would just hammer OverFast for stale data.
 */
export async function fetchCompetitiveStats(
  battleTag: string
): Promise<CompetitiveStatsResult> {
  const playerId = encodeURIComponent(battleTag);
  const url = `${OVERFAST_BASE_URL}/players/${playerId}/stats/summary?gamemode=competitive`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "owstats (personal 2-player OW tracker; +https://github.com/Navi412/owstats)",
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    return { status: "error", message: `Network error calling OverFast: ${String(err)}` };
  }

  if (response.status === 404) {
    return { status: "not_found" };
  }

  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      // ignore
    }
    return {
      status: "error",
      message: `OverFast returned HTTP ${response.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`,
    };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (err) {
    return { status: "error", message: `Could not parse OverFast response: ${String(err)}` };
  }

  const general = (body as { general?: unknown } | null)?.general as
    | { games_played?: unknown; games_won?: unknown }
    | null
    | undefined;

  if (!general) {
    // Career is private, or the player has never played competitive.
    return { status: "private" };
  }

  const gamesPlayed = general.games_played;
  const gamesWon = general.games_won;

  if (typeof gamesPlayed !== "number" || typeof gamesWon !== "number") {
    return {
      status: "error",
      message: `Unexpected OverFast payload shape: ${JSON.stringify(body).slice(0, 300)}`,
    };
  }

  return { status: "ok", gamesPlayed, gamesWon, payload: general };
}
