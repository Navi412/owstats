import type { Streak } from "@/lib/streak";

export function StreakBadge({ streak }: { streak: Streak }) {
  if (streak.type === "none" || streak.length === 0) {
    return (
      <div className="p5-panel-tight border-2 border-text-muted/50 bg-surface-1 px-4 py-3 flex items-center gap-3">
        <span className="h-2.5 w-2.5 rounded-full bg-text-muted shrink-0" aria-hidden />
        <p className="text-sm text-text-secondary">Sin racha activa todavía</p>
      </div>
    );
  }

  const isWin = streak.type === "win";
  const label = isWin ? "VICTORIAS SEGUIDAS" : "DERROTAS SEGUIDAS";

  return (
    <div
      className={`p5-panel-tight p5-tile-hover cursor-pointer px-4 py-3 flex items-center gap-3 border-2 ${
        isWin ? "bg-p5-red border-p5-red" : "bg-surface-1 border-text-primary/60"
      }`}
    >
      <span
        className={`p5-heading text-2xl leading-none shrink-0 ${isWin ? "text-black" : "text-text-primary"}`}
        aria-hidden
      >
        {isWin ? "W" : "L"}
      </span>
      <p className={`text-sm ${isWin ? "text-black/80" : "text-text-secondary"}`}>
        Racha actual:{" "}
        <span className={`p5-heading text-base ${isWin ? "text-black" : "text-text-primary"}`}>
          {streak.length} {label}
        </span>
      </p>
    </div>
  );
}
