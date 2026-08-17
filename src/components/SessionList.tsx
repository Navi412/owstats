import type { SessionDay } from "@/lib/queries";
import { toDate } from "@/lib/dates";

function formatDayHeading(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  });
}

function formatTime(value: Date | string): string {
  return toDate(value).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });
}

export function SessionList({ sessions }: { sessions: SessionDay[] }) {
  if (sessions.length === 0) {
    return (
      <section className="p5-panel p-6">
        <h2 className="p5-heading text-xl text-text-primary mb-1">Últimas sesiones</h2>
        <p className="text-sm text-text-muted">Todavía no se registraron partidas.</p>
      </section>
    );
  }

  return (
    <section className="p5-panel p-6">
      <h2 className="p5-heading text-xl text-text-primary mb-4">Últimas sesiones</h2>
      <ul className="flex flex-col gap-4">
        {sessions.map((day) => (
          <li key={day.day} className="bg-surface-2 border-l-4 border-p5-red p-4">
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <p className="p5-heading text-base text-text-primary">
                {formatDayHeading(day.day)}
              </p>
              <p className="text-xs text-text-secondary shrink-0">
                <span className="text-status-good font-semibold">{day.wins}V</span>
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
                    {formatTime(w.windowStart)}–{formatTime(w.windowEnd)}
                  </span>
                  <span>
                    {w.games} {w.games === 1 ? "partida" : "partidas"} ·{" "}
                    <span className="text-status-good font-semibold">{w.wins}V</span>{" "}
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
