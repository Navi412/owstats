const VAR_HINTS: Record<string, string> = {
  DATABASE_URL: "Connection string de tu proyecto Neon",
  CRON_SECRET: "Secreto compartido para /api/poll (openssl rand -hex 32)",
  PLAYER_1: "Battletag de la jugadora 1, formato Nick-1234",
  PLAYER_2: "Battletag de la jugadora 2, formato Nick-1234",
};

export function SetupNotice({ missing }: { missing: string[] }) {
  return (
    <section className="p5-panel p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="p5-heading h-10 w-10 bg-p5-red border-2 border-p5-red flex items-center justify-center text-black text-xl shrink-0">
          !
        </span>
        <div>
          <h1 className="p5-heading text-xl text-text-primary">Faltan variables de entorno</h1>
          <p className="text-sm text-text-secondary">owstats no puede arrancar sin esto</p>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {missing.map((name) => (
          <li
            key={name}
            className="bg-surface-2 border-l-4 border-p5-red px-3 py-2 flex flex-col gap-0.5"
          >
            <code className="text-sm font-mono text-p5-red-bright">{name}</code>
            <span className="text-xs text-text-muted">{VAR_HINTS[name] ?? "Requerida"}</span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-text-muted leading-relaxed">
        Configúralas en tu <code className="font-mono text-text-secondary">.env.local</code> (dev)
        o en Project Settings → Environment Variables (Vercel), y vuelve a desplegar. Instrucciones
        completas en el <code className="font-mono text-text-secondary">README.md</code> del repo.
      </p>
    </section>
  );
}
