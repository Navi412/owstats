import { Scoreboard } from "@/components/Scoreboard";
import { StreakBadge } from "@/components/StreakBadge";
import { WinrateChart } from "@/components/WinrateChart";
import { SessionList } from "@/components/SessionList";
import { SyncStatusBanner } from "@/components/SyncStatusBanner";
import {
  getDailyWinrate,
  getPlayers,
  getRecentMatchRows,
  getRecentSessions,
  getScoreboardTotals,
  getSyncStatus,
} from "@/lib/queries";
import { computeCurrentStreak } from "@/lib/streak";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [totals, dailyWinrate, recentMatches, sessions, syncStatus, players] = await Promise.all([
    getScoreboardTotals(),
    getDailyWinrate(30),
    getRecentMatchRows(100),
    getRecentSessions(14),
    getSyncStatus(),
    getPlayers(),
  ]);

  const streak = computeCurrentStreak(recentMatches);
  const subtitle =
    players.length === 2
      ? `${players[0].display_name} & ${players[1].display_name}`
      : "Configura PLAYER_1 y PLAYER_2 y lanza el primer poll";

  return (
    <div className="flex flex-1 justify-center">
      <main className="flex w-full max-w-md flex-col gap-4 px-4 py-6 sm:max-w-lg">
        <header className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold text-text-primary">owstats</h1>
          <p className="text-sm text-text-secondary">{subtitle}</p>
        </header>

        <SyncStatusBanner syncStatus={syncStatus} />
        <Scoreboard totals={totals} />
        <StreakBadge streak={streak} />
        <WinrateChart data={dailyWinrate} />
        <SessionList sessions={sessions} />
      </main>
    </div>
  );
}
