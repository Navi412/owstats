import { Scoreboard } from "@/components/Scoreboard";
import { StreakBadge } from "@/components/StreakBadge";
import { WinrateChart } from "@/components/WinrateChart";
import { SessionList } from "@/components/SessionList";
import { SyncStatusBanner } from "@/components/SyncStatusBanner";
import { SetupNotice } from "@/components/SetupNotice";
import { ErrorNotice } from "@/components/ErrorNotice";
import { classifyDbError } from "@/lib/dbError";
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
        <header className="relative mb-2 -rotate-1">
          <div className="p5-stripe inline-flex items-center gap-2 px-4 py-1.5 shadow-[4px_4px_0_0_rgba(0,0,0,0.6)]">
            <h1 className="p5-heading text-3xl text-text-primary drop-shadow-[1px_1px_0_rgba(0,0,0,0.8)]">
              Owstats
            </h1>
          </div>
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
    const { kind, detail } = classifyDbError(err);
    return (
      <Shell>
        <ErrorNotice kind={kind} detail={detail} />
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
      <p className="text-sm text-text-secondary mb-1 pl-1">{subtitle}</p>
      <SyncStatusBanner syncStatus={syncStatus} />
      <Scoreboard totals={totals} />
      <StreakBadge streak={streak} />
      <WinrateChart data={dailyWinrate} />
      <SessionList sessions={sessions} />
    </Shell>
  );
}
