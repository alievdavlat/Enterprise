import type { SchemaRegistry } from "@enterprise/core";
import type { DatabaseAdapter } from "@enterprise/database";
import type { ContentTypeSchema, FieldDefinition } from "@enterprise/types";

const MEDIA_TABLE = "enterprise_media";

/**
 * Decide which fields the populate spec wants hydrated.
 *
 * Strapi semantics:
 *   `*`                  → every relation / media / component / dynamiczone field
 *   `["title", "cover"]` → just those names
 *   undefined            → nothing
 */
function shouldPopulate(field: string, spec: string[] | undefined): boolean {
  if (!spec || spec.length === 0) return false;
  if (spec.includes("*")) return true;
  return spec.includes(field);
}

type RowList = Record<string, unknown>[];

interface PopulateContext {
  db: DatabaseAdapter;
  schemaRegistry: SchemaRegistry;
}

/**
 * Hydrate media / relation IDs on `rows` in-place. Issues one bulk query per
 * populated field (no N+1) so the cost is O(populated-fields) regardless of
 * page size.
 *
 * Mutation is intentional — content-types router already returns the array
 * it built locally, so updating each row object lets the existing response
 * shape work without touching callers.
 *
 * Components & dynamic zones are no-ops for now; their join-table layer
 * lands in a later phase.
 */
export async function populateRows(
  rows: RowList,
  schema: ContentTypeSchema,
  ctx: PopulateContext,
  populateSpec?: string[],
): Promise<void> {
  if (rows.length === 0) return;
  if (!populateSpec || populateSpec.length === 0) return;

  const attrs = (schema.attributes ?? {}) as Record<string, FieldDefinition>;
  for (const [fieldName, attr] of Object.entries(attrs)) {
    if (!shouldPopulate(fieldName, populateSpec)) continue;
    if (attr.type === "media") {
      await hydrateField(rows, fieldName, MEDIA_TABLE, ctx.db, attr.multiple);
    } else if (attr.type === "relation" && attr.target) {
      const target = ctx.schemaRegistry.get(attr.target);
      if (!target) continue;
      const isMany = attr.relation === "oneToMany" || attr.relation === "manyToMany";
      await hydrateField(rows, fieldName, target.collectionName, ctx.db, isMany);
    }
    // component / dynamiczone deferred — Phase 6 follow-up.
  }
}

/**
 * Replace ID-shaped values on `rows[*][field]` with the full row(s) fetched
 * from `targetTable`. Handles both singular (value is one ID) and multiple
 * (value is array of IDs) shapes.
 *
 * Already-hydrated values (objects, not primitives) are left alone so the
 * helper is safe to call after a route handler has already populated them.
 */
async function hydrateField(
  rows: RowList,
  field: string,
  targetTable: string,
  db: DatabaseAdapter,
  isMany?: boolean,
): Promise<void> {
  const ids = new Set<string | number>();
  for (const row of rows) {
    const value = row[field];
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const v of value) collectId(v, ids);
    } else {
      collectId(value, ids);
    }
  }
  if (ids.size === 0) return;

  let fetched: RowList = [];
  try {
    const result = await db.findMany(targetTable, {
      filters: { id: { $in: Array.from(ids) } },
      pagination: { page: 1, pageSize: Math.max(ids.size, 1) },
    });
    fetched = result.data as RowList;
  } catch {
    // Table may not exist (just-registered relation target) — leave the
    // raw ID in place and let the caller decide what to do.
    return;
  }

  const byId = new Map<string, Record<string, unknown>>();
  for (const target of fetched) {
    if (target?.id != null) byId.set(String(target.id), target);
  }

  for (const row of rows) {
    const value = row[field];
    if (value == null) continue;
    if (Array.isArray(value)) {
      row[field] = value
        .map((v) => resolveOne(v, byId))
        .filter((v): v is Record<string, unknown> => v != null);
    } else {
      const resolved = resolveOne(value, byId);
      // Single-valued media may legitimately come back as an array of one
      // when the schema flips between single/multi; normalise to a single
      // object so the client doesn't have to guess.
      row[field] = isMany && resolved ? [resolved] : resolved ?? value;
    }
  }
}

function collectId(value: unknown, target: Set<string | number>): void {
  if (value == null) return;
  if (typeof value === "number" || typeof value === "string") {
    target.add(value);
    return;
  }
  if (typeof value === "object") {
    const id = (value as Record<string, unknown>).id;
    if (typeof id === "number" || typeof id === "string") target.add(id);
  }
}

function resolveOne(
  value: unknown,
  byId: Map<string, Record<string, unknown>>,
): Record<string, unknown> | null {
  if (value == null) return null;
  if (typeof value === "object") {
    const idVal = (value as Record<string, unknown>).id;
    if (idVal != null) return byId.get(String(idVal)) ?? (value as Record<string, unknown>);
    return value as Record<string, unknown>;
  }
  return byId.get(String(value)) ?? null;
}
