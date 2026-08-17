export function ErrorNotice({ detail }: { detail: string }) {
  return (
    <section className="rounded-2xl bg-surface-1 border border-white/10 shadow-xl shadow-black/40 p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="h-9 w-9 rounded-full bg-status-critical/15 border border-status-critical/30 flex items-center justify-center text-status-critical text-lg font-semibold shrink-0">
          !
        </span>
        <div>
          <h1 className="text-base font-semibold text-text-primary">No se pudo conectar a la base de datos</h1>
          <p className="text-sm text-text-secondary">
            Revisa que <code className="font-mono text-text-muted">DATABASE_URL</code> sea correcto
            y que ejecutaste <code className="font-mono text-text-muted">db/schema.sql</code> contra
            tu proyecto Neon.
          </p>
        </div>
      </div>

      <details className="rounded-lg bg-surface-2 border border-white/5 px-3 py-2">
        <summary className="text-xs text-text-muted cursor-pointer select-none">
          Detalle técnico
        </summary>
        <pre className="mt-2 text-xs text-text-secondary whitespace-pre-wrap break-words font-mono">
          {detail}
        </pre>
      </details>
    </section>
  );
}
