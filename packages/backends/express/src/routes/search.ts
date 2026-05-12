import { Router, Request, Response, NextFunction } from "express";
import type { SchemaRegistry, PermissionManager } from "@enterprise/core";
import type { DatabaseAdapter } from "@enterprise/database";
import type { FieldDefinition } from "@enterprise/types";
import { applyTextSearchFilter, resolveSearchFields } from "./content-types";
import { resolveRequestRole } from "../middlewares/auth";

/**
 * Global search endpoint. Mounted at `/api/search`. Searches every collection
 * type the requesting role can `find`, returning the top hits per type so a
 * Cmd+K style palette in the admin can offer cross-content suggestions.
 *
 *   GET /api/search?q=foo
 *     → searches every readable type
 *   GET /api/search?q=foo&types=api::article.article,api::page.page
 *     → restrict to listed uids
 *   GET /api/search?q=foo&limit=5
 *     → top N per type (defaults to 5, capped at 25)
 */
export function createSearchRouter(
  schemaRegistry: SchemaRegistry,
  db: DatabaseAdapter,
  permissionManager?: PermissionManager,
): Router {
  const router = Router();

  router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = ((req.query.q as string | undefined) ?? "").trim();
      if (!q) {
        return res.json({ data: [], meta: { query: "", count: 0 } });
      }
      const limit = Math.min(25, Math.max(1, Number(req.query.limit) || 5));
      const typesParam = (req.query.types as string | undefined) ?? "";
      const requestedTypes = typesParam
        ? new Set(typesParam.split(",").map((s) => s.trim()).filter(Boolean))
        : null;
      const role = resolveRequestRole(req, "find");

      const results: {
        uid: string;
        displayName: string;
        kind: string;
        hits: Record<string, unknown>[];
      }[] = [];
      let totalHits = 0;

      for (const schema of schemaRegistry.getAll()) {
        if (schema.kind !== "collectionType") continue;
        if (requestedTypes && !requestedTypes.has(schema.uid)) continue;

        // Role-based visibility: skip uids the requester can't list.
        if (permissionManager && !permissionManager.can(`${schema.uid}.find`, role)) {
          continue;
        }

        const attrs = (schema.attributes || {}) as Record<string, FieldDefinition>;
        const searchFields = resolveSearchFields(attrs);
        if (searchFields.length === 0) continue;

        try {
          const filters = applyTextSearchFilter({}, attrs, q);
          const { data } = await db.findMany(schema.collectionName, {
            filters,
            pagination: { page: 1, pageSize: limit },
          });
          if (data.length > 0) {
            results.push({
              uid: schema.uid,
              displayName: schema.displayName,
              kind: schema.kind,
              hits: data as Record<string, unknown>[],
            });
            totalHits += data.length;
          }
        } catch {
          // Table may not exist yet (just-registered schema) — skip silently.
        }
      }

      res.json({ data: results, meta: { query: q, count: totalHits } });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
