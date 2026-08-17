import { Scoreboard } from "@/components/Scoreboard";
import { StreakBadge } from "@/components/StreakBadge";
import { WinrateChart } from "@/components/WinrateChart";
import { SessionList } from "@/components/SessionList";
import { SyncStatusBanner } from "@/components/SyncStatusBanner";
import { SetupNotice } from "@/components/SetupNotice";
import { ErrorNotice } from "@/components/ErrorNotice";
import { getMissingEnvVars } from "@/lib/env";
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

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 justify-center">
      <main className="flex w-full max-w-md flex-col gap-4 px-4 py-6 sm:max-w-lg">
        <header className="flex items-center gap-2.5 mb-1">
          <span
            className="h-8 w-8 rounded-lg shrink-0"
            style={{
              background: "linear-gradient(135deg, #3987e5, #9085e9)",
            }}
            aria-hidden
          />
          <h1 className="text-lg font-semibold tracking-tight text-text-primary">owstats</h1>
        </header>
        {children}
      </main>
    </div>
  );
}

export default async function Home() {
  const missing = getMissingEnvVars();
  if (missing.length > 0) {
    return (
      <Shell>
        <SetupNotice missing={missing} />
      </Shell>
    );
  }

  let data;
  try {
    data = await Promise.all([
      getScoreboardTotals(),
      getDailyWinrate(30),
      getRecentMatchRows(100),
      getRecentSessions(14),
      getSyncStatus(),
      getPlayers(),
    ]);
  } catch (err) {
    return (
      <Shell>
        <ErrorNotice detail={String(err)} />
      </Shell>
    );
  }

  const [totals, dailyWinrate, recentMatches, sessions, syncStatus, players] = data;
  const streak = computeCurrentStreak(recentMatches);
  const subtitle =
    players.length === 2
      ? `${players[0].display_name} & ${players[1].display_name}`
      : "Esperando el primer poll para conocer a las jugadoras";

  return (
    <Shell>
      <p className="text-sm text-text-secondary -mt-3 mb-1">{subtitle}</p>
      <SyncStatusBanner syncStatus={syncStatus} />
      <Scoreboard totals={totals} />
      <StreakBadge streak={streak} />
      <WinrateChart data={dailyWinrate} />
      <SessionList sessions={sessions} />
    </Shell>
  );
}
