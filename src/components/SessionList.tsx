import type { SessionDay } from "@/lib/queries";

function formatDayHeading(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function SessionList({ sessions }: { sessions: SessionDay[] }) {
  if (sessions.length === 0) {
    return (
      <section className="rounded-2xl bg-surface-1 border border-white/10 p-6">
        <h2 className="text-sm font-semibold text-text-primary mb-1">Últimas sesiones</h2>
        <p className="text-sm text-text-muted">Todavía no se registraron partidas.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-surface-1 border border-white/10 p-6">
      <h2 className="text-sm font-semibold text-text-primary mb-4">Últimas sesiones</h2>
      <ul className="flex flex-col gap-4">
        {sessions.map((day) => (
          <li key={day.day} className="rounded-xl bg-surface-2 p-4">
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-text-primary capitalize">
                {formatDayHeading(day.day)}
              </p>
              <p className="text-xs text-text-secondary shrink-0">
                <span className="text-status-good">{day.wins}V</span>
                {" / "}
                <span className="text-status-critical">{day.losses}D</span>
              </p>
            </div>
            <ul className="flex flex-col gap-1.5">
              {day.windows.map((w) => (
                <li
                  key={w.windowEnd}
                  className="flex items-center justify-between text-xs text-text-secondary"
                >
                  <span className="text-text-muted font-mono">
                    {formatTime(w.windowStart)}–{formatTime(w.windowEnd)} UTC
                  </span>
                  <span>
                    {w.games} {w.games === 1 ? "partida" : "partidas"} ·{" "}
                    <span className="text-status-good">{w.wins}V</span>{" "}
                    <span className="text-status-critical">{w.losses}D</span>
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
