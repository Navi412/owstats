import type { SyncStatus } from "@/lib/queries";
import type { PlayerPollStatus } from "@/lib/types";

const STATUS_LABELS: Record<PlayerPollStatus, string> = {
  ok: "ok",
  season_reset: "reinicio de temporada detectado",
  no_change: "sin cambios",
  private: "perfil privado",
  not_found: "jugadora no encontrada",
  error: "error de conexión con OverFast",
};

function formatAbsolute(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }) + " UTC";
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "hace instantes";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} d`;
}

export function SyncStatusBanner({ syncStatus }: { syncStatus: SyncStatus }) {
  const { lastSuccessful, lastRun } = syncStatus;

  if (!lastRun) {
    return (
      <div className="rounded-xl border border-white/10 bg-surface-1 px-4 py-3 text-sm text-text-muted">
        Todavía no se ejecutó ninguna sincronización. Lanza el workflow de GitHub Actions o
        espera al próximo cron.
      </div>
    );
  }

  const latestFailed = lastRun.id !== lastSuccessful?.id;

  return (
    <div className="rounded-xl border border-white/10 bg-surface-1 px-4 py-3 flex flex-col gap-2">
      {lastSuccessful ? (
        <div className="flex items-start gap-2">
          <span className="mt-1 h-2 w-2 rounded-full bg-status-good shrink-0" aria-hidden />
          <p className="text-sm text-text-secondary">
            Última sincronización correcta:{" "}
            <span className="text-text-primary font-medium">
              {formatRelative(lastSuccessful.run_at)}
            </span>{" "}
            <span className="text-text-muted">({formatAbsolute(lastSuccessful.run_at)})</span>
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <span className="mt-1 h-2 w-2 rounded-full bg-status-critical shrink-0" aria-hidden />
          <p className="text-sm text-text-secondary">Todavía no hubo ninguna sincronización correcta.</p>
        </div>
      )}

      {latestFailed && (
        <div className="flex items-start gap-2">
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-status-critical shrink-0" aria-hidden />
          <p className="text-xs text-status-critical">
            El último intento ({formatRelative(lastRun.run_at)}) tuvo problemas — jugadora 1:{" "}
            {STATUS_LABELS[lastRun.player_1_status]}, jugadora 2:{" "}
            {STATUS_LABELS[lastRun.player_2_status]}.
          </p>
        </div>
      )}
    </div>
  );
}
