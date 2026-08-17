"use server";

import { refresh } from "next/cache";
import { runPoll } from "@/lib/poll";

const MIN_INTERVAL_MS = 60_000;

let lastRunAt = 0;

export interface TriggerPollResult {
  ok: boolean;
  rateLimited: boolean;
  retryAfterSeconds?: number;
  error?: string;
}

/** Runs the same poll as /api/poll, but invoked directly server-side so no CRON_SECRET is needed. */
export async function triggerPoll(): Promise<TriggerPollResult> {
  const now = Date.now();
  const elapsed = now - lastRunAt;

  if (elapsed < MIN_INTERVAL_MS) {
    return {
      ok: false,
      rateLimited: true,
      retryAfterSeconds: Math.ceil((MIN_INTERVAL_MS - elapsed) / 1000),
    };
  }
  lastRunAt = now;

  try {
    await runPoll();
    refresh();
    return { ok: true, rateLimited: false };
  } catch (err) {
    console.error("[triggerPoll] unhandled error", err);
    return { ok: false, rateLimited: false, error: "No se pudo completar la sincronización." };
  }
}
