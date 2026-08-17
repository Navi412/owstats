"use client";

import { useState, useTransition } from "react";
import { triggerPoll } from "@/lib/actions";

export function UpdateNowButton() {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleClick() {
    setFeedback(null);
    startTransition(async () => {
      const result = await triggerPoll();
      if (result.rateLimited) {
        setFeedback(`Espera ${result.retryAfterSeconds}s antes de volver a actualizar.`);
      } else if (!result.ok) {
        setFeedback(result.error ?? "No se pudo actualizar.");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="p5-heading p5-panel-tight border-2 border-p5-red bg-p5-red px-4 py-1.5 text-sm text-text-primary shadow-[3px_3px_0_0_rgba(0,0,0,0.6)] transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Actualizando..." : "Actualizar ahora"}
      </button>
      {feedback && <p className="pl-1 text-xs text-text-muted">{feedback}</p>}
    </div>
  );
}
