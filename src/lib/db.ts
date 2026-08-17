import { neon } from "@neondatabase/serverless";
import { env } from "./env";

let client: ReturnType<typeof neon> | null = null;

/** Tagged-template SQL client against Neon, created lazily so build-time
 * imports of this module don't require DATABASE_URL to be set. */
export function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  if (!client) {
    client = neon(env.databaseUrl);
  }
  return client(strings, ...values);
}
