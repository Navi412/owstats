import type { ReactNode } from "react";
import type { DbErrorKind } from "@/lib/dbError";

const COPY: Record<DbErrorKind, { title: string; description: ReactNode }> = {
  connection: {
    title: "No se pudo conectar a la base de datos",
    description: (
      <>
        Revisa que <code className="font-mono text-text-muted">DATABASE_URL</code> sea correcto
        y que ejecutaste <code className="font-mono text-text-muted">db/schema.sql</code> contra
        tu proyecto Neon.
      </>
    ),
  },
  query: {
    title: "Error al cargar los datos",
    description: (
      <>
        Se conectó a la base de datos, pero una consulta falló. Puede que el esquema esté
        desactualizado — revisa que <code className="font-mono text-text-muted">db/schema.sql</code>{" "}
        coincida con lo que hay en tu proyecto Neon.
      </>
    ),
  },
};

export function ErrorNotice({ kind, detail }: { kind: DbErrorKind; detail: string }) {
  const { title, description } = COPY[kind];

  return (
    <section className="p5-panel p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="p5-heading h-10 w-10 bg-p5-red border-2 border-p5-red flex items-center justify-center text-black text-xl shrink-0">
          !
        </span>
        <div>
          <h1 className="p5-heading text-lg text-text-primary">{title}</h1>
          <p className="text-sm text-text-secondary">{description}</p>
        </div>
      </div>

      <details className="bg-surface-2 border-l-4 border-p5-red px-3 py-2">
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
