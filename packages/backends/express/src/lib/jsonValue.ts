/**
 * Read a JSON value coming out of the database that may arrive in two shapes:
 *
 *  - a raw JSON **string** (Postgres / MySQL, or any value not auto-parsed), or
 *  - an already-parsed **object / array** — the SqliteAdapter rehydrates any
 *    text column whose value looks like JSON (`{…}` / `[…]`) into a real object,
 *    so `row.value` is no longer a string by the time a route reads it.
 *
 * Callers used to do `JSON.parse(row.value)`, which throws on the SQLite path
 * (`JSON.parse({…})` stringifies to "[object Object]") and silently fell back
 * to a default — quietly breaking core_store-backed features (plugin/middleware
 * toggles, backup schedule, permission conditions, plugin manifests, …).
 *
 * This helper normalizes both shapes and returns `fallback` when the value is
 * missing or unparseable.
 */
export function parseJsonValue<T = unknown>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "object") return value as T; // already rehydrated by the adapter
  if (typeof value === "string") {
    if (value.length === 0) return fallback;
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}
