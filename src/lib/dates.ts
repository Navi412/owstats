/**
 * Neon's driver parses `timestamptz`/`date` columns into JS `Date` objects
 * (not strings), so any code doing string ops (`.slice()`, etc.) on a raw DB
 * date value breaks. These helpers normalize DB date values — tolerating
 * both `Date` and `string`, since some code paths (e.g. JSON round-trips)
 * still hand us ISO strings — instead of assuming a shape.
 */

export function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/** Formats a DB date/timestamp value as YYYY-MM-DD, in UTC. */
export function formatYMD(value: Date | string): string {
  const d = toDate(value);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
