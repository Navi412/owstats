import { NeonDbError } from "@neondatabase/serverless";

export type DbErrorKind = "connection" | "query";

export interface DbErrorInfo {
  kind: DbErrorKind;
  detail: string;
}

const CONNECTION_SIGNS = [
  "fetch failed",
  "ECONNREFUSED",
  "ENOTFOUND",
  "ETIMEDOUT",
  "network",
  "Missing required environment variable",
];

/**
 * Distinguishes "never reached the database" from "reached it, but the
 * query/schema failed" so the UI doesn't blame DATABASE_URL for e.g. a
 * missing column.
 *
 * A NeonDbError with a `code` (a Postgres SQLSTATE) means the server
 * responded, so the connection itself was fine; one without a `code` (or
 * any other error whose message looks network-shaped) means we likely
 * never reached the database.
 */
export function classifyDbError(err: unknown): DbErrorInfo {
  const detail = err instanceof Error ? (err.stack ?? err.message) : String(err);
  const message = err instanceof Error ? err.message : String(err);

  if (err instanceof NeonDbError) {
    return { kind: err.code ? "query" : "connection", detail };
  }

  const kind: DbErrorKind = CONNECTION_SIGNS.some((sign) => message.includes(sign))
    ? "connection"
    : "query";

  return { kind, detail };
}
