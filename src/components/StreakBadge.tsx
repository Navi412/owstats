import type { Streak } from "@/lib/streak";

export function StreakBadge({ streak }: { streak: Streak }) {
  if (streak.type === "none" || streak.length === 0) {
    return (
      <div className="rounded-2xl bg-surface-1 border border-white/10 shadow-xl shadow-black/40 p-4 flex items-center gap-3">
        <span className="h-2.5 w-2.5 rounded-full bg-text-muted" aria-hidden />
        <p className="text-sm text-text-secondary">Sin racha activa todavía</p>
      </div>
    );
  }

  const isWin = streak.type === "win";
  const color = isWin ? "var(--status-good)" : "var(--status-critical)";
  const label = isWin ? "victorias seguidas" : "derrotas seguidas";

  return (
    <div className="rounded-2xl bg-surface-1 border border-white/10 shadow-xl shadow-black/40 p-4 flex items-center gap-3">
      <span
        className="h-2.5 w-2.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <p className="text-sm text-text-secondary">
        Racha actual:{" "}
        <span className="font-semibold" style={{ color }}>
          {streak.length} {label}
        </span>
      </p>
    </div>
  );
}
