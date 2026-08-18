import type { ScoreboardTotals } from "@/lib/queries";

function formatWinrate(winrate: number | null): string {
  if (winrate === null) return "—";
  return `${winrate.toFixed(1)}%`;
}

export function Scoreboard({ totals }: { totals: ScoreboardTotals }) {
  return (
    <section
      aria-label="Marcador"
      className="p5-panel relative overflow-hidden p-6 flex flex-col items-center gap-6"
    >
      <div
        className="pointer-events-none absolute -top-24 h-56 w-56 rounded-full blur-3xl opacity-30"
        style={{ background: "radial-gradient(circle, #a855f7, transparent 70%)" }}
        aria-hidden
      />

      <div className="relative text-center">
        <p className="p5-heading text-sm text-text-secondary mb-1">Winrate jugando juntas</p>
        <p className="p5-heading text-[72px] leading-none text-text-primary drop-shadow-[2px_2px_0_rgba(126,34,206,0.6)]">
          {formatWinrate(totals.winrate)}
        </p>
      </div>

      <div className="relative grid grid-cols-2 gap-3 w-full">
        <div className="p5-panel-tight p5-tile-hover bg-p5-red px-4 py-3 text-center border-2 border-p5-red cursor-pointer">
          <p className="p5-heading text-xs text-black/70 mb-1">Victorias</p>
          <p className="p5-heading text-3xl text-black drop-shadow-none">{totals.wins}</p>
        </div>
        <div className="p5-panel-tight p5-tile-hover bg-surface-2 px-4 py-3 text-center border-2 border-text-primary/60 cursor-pointer">
          <p className="p5-heading text-xs text-text-secondary mb-1">Derrotas</p>
          <p className="p5-heading text-3xl text-text-primary">{totals.losses}</p>
        </div>
      </div>

      <p className="relative text-xs text-text-muted">{totals.gamesPlayed} partidas registradas</p>
    </section>
  );
}
