import type { ScoreboardTotals } from "@/lib/queries";

function formatWinrate(winrate: number | null): string {
  if (winrate === null) return "—";
  return `${winrate.toFixed(1)}%`;
}

export function Scoreboard({ totals }: { totals: ScoreboardTotals }) {
  return (
    <section
      aria-label="Marcador"
      className="relative overflow-hidden rounded-2xl bg-surface-1 border border-white/10 shadow-xl shadow-black/40 p-6 flex flex-col items-center gap-6"
    >
      <div
        className="pointer-events-none absolute -top-24 h-48 w-48 rounded-full blur-3xl opacity-25"
        style={{ background: "radial-gradient(circle, #3987e5, transparent 70%)" }}
        aria-hidden
      />

      <div className="relative text-center">
        <p className="text-sm text-text-secondary mb-1">Winrate jugando juntas</p>
        <p className="text-[64px] leading-none font-semibold tracking-tight text-text-primary">
          {formatWinrate(totals.winrate)}
        </p>
      </div>

      <div className="relative grid grid-cols-2 gap-3 w-full">
        <div className="rounded-xl bg-surface-2 border border-white/5 px-4 py-3 text-center">
          <p className="text-xs text-text-secondary mb-1">Victorias</p>
          <p className="text-2xl font-semibold text-status-good">{totals.wins}</p>
        </div>
        <div className="rounded-xl bg-surface-2 border border-white/5 px-4 py-3 text-center">
          <p className="text-xs text-text-secondary mb-1">Derrotas</p>
          <p className="text-2xl font-semibold text-status-critical">{totals.losses}</p>
        </div>
      </div>

      <p className="relative text-xs text-text-muted">{totals.gamesPlayed} partidas registradas</p>
    </section>
  );
}
