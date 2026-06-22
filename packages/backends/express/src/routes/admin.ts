import { Router, Request, Response, NextFunction } from "express";
import type { SchemaRegistry } from "@enterprise/core";
import type { DatabaseAdapter } from "@enterprise/database";
import type { ContentTypeSchema } from "@enterprise/types";
import { ensureTableForSchema } from "../loadSchemasFromDb";
import { syncSchemaToFile, deleteSchemaFile } from "../schemaSync";
import { SCHEMAS_TABLE, type AdminCtx, type AdminRouterOptions } from "./admin/shared";
import { registerBuilderRoutes } from "./admin/builder.controller";
import { registerDataTransferRoutes } from "./admin/data-transfer.controller";
import { registerIamRoutes } from "./admin/iam.controller";
import { registerSettingsRoutes } from "./admin/settings.controller";
import { registerContentAdminRoutes } from "./admin/content-admin.controller";

/**
 * Builds the /api/admin router. The router is split into focused controllers
 * under ./admin/*; this function wires the shared context and registers each.
 * Only the schema/content-type + system/stats endpoints remain inline here.
 */
export function createAdminRouter(
  schemaRegistry: SchemaRegistry,
  db: DatabaseAdapter,
  options: AdminRouterOptions = {},
): Router {
  const router = Router();
  const getProjectRoot = options.getProjectRoot;
  const getDiscoveredArtifacts = options.getDiscoveredArtifacts;

  // Shared context for the extracted controller modules (see ./admin/*).
  const ctx: AdminCtx = { router, db, schemaRegistry, options };
  registerBuilderRoutes(ctx); // cron / middlewares / routes / services / lifecycles / extensions / plugins / migrations
  registerDataTransferRoutes(ctx); // export / import + scheduled backup
  registerIamRoutes(ctx); // ACL catalog, OAuth providers, users, roles, API tokens
  registerSettingsRoutes(ctx); // core store, tokens, audit, review workflows, i18n, email, toggles, email templates
  registerContentAdminRoutes(ctx); // user edit/delete, content history, RBAC permissions

  // ---- System / Discovered artifacts ----
  router.get("/system", (_req: Request, res: Response) => {
    if (!getDiscoveredArtifacts) {
      return res.json({
        data: {
          plugins: { registered: [], disabled: [] },
          middlewares: { resolved: [], unresolved: [], discovered: [] },
          cron: [],
          services: { registered: [], skipped: [] },
        },
      });
    }
    res.json({ data: getDiscoveredArtifacts() });
  });


  /**
   * GET /api/admin/content-types
   * List all content type schemas
   */
  router.get("/content-types", (req: Request, res: Response) => {
    try {
      const schemas = schemaRegistry.getAll();
      res.json({ data: schemas });
    } catch (err) {
      console.error("[Admin] GET /content-types error:", err);
      res.status(200).json({ data: [] });
    }
  });

  /**
   * GET /api/admin/content-types/:uid
   * Get a single content type schema
   */
  router.get("/content-types/:uid", (req: Request, res: Response) => {
    const uid = Array.isArray(req.params.uid) ? req.params.uid[0] : req.params.uid;
    const schema = schemaRegistry.get(uid);
    if (!schema) {
      return res
        .status(404)
        .json({ error: { status: 404, message: "Content type not found" } });
    }
    res.json({ data: schema });
  });

  /**
   * POST /api/admin/content-types
   * Create a new content type schema (persist to DB + create data table)
   */
  router.post(
    "/content-types",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema: ContentTypeSchema = req.body;
        const schemaStr = JSON.stringify(schema);
        const existing = await db.findOneBy(SCHEMAS_TABLE, { uid: schema.uid });
        if (existing) {
          await db.update(SCHEMAS_TABLE, (existing as { id: number }).id, { schema: schemaStr });
        } else {
          await db.create(SCHEMAS_TABLE, { uid: schema.uid, schema: schemaStr });
        }
        schemaRegistry.register(schema);
        await ensureTableForSchema(db, schema);
        if (getProjectRoot) syncSchemaToFile(schema, getProjectRoot());
        options?.onSchemaRegistered?.(schema);

        res
          .status(201)
          .json({ data: schema, message: "Content type created successfully" });
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * PUT /api/admin/content-types/:uid
   * Update a content type schema (persist to DB)
   */
  router.put(
    "/content-types/:uid",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const uid = Array.isArray(req.params.uid) ? req.params.uid[0] : req.params.uid;
        const updates = req.body;
        schemaRegistry.update(uid, updates);
        const updated = schemaRegistry.get(uid);
        const row = await db.findOneBy(SCHEMAS_TABLE, { uid });
        if (row && updated) {
          await db.update(SCHEMAS_TABLE, (row as { id: number }).id, { schema: JSON.stringify(updated) });
          await ensureTableForSchema(db, updated);
          if (getProjectRoot) syncSchemaToFile(updated, getProjectRoot());
        }
        res.json({
          data: updated,
          message: "Content type updated successfully",
        });
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * DELETE /api/admin/content-types/:uid
   * Remove schema from DB + registry. Also drops the data table.
   */
  router.delete(
    "/content-types/:uid",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const uid = Array.isArray(req.params.uid) ? req.params.uid[0] : req.params.uid;
        const schema = schemaRegistry.get(uid);
        if (!schema) {
          return res
            .status(404)
            .json({
              error: { status: 404, message: "Content type not found" },
            });
        }
        const row = await db.findOneBy(SCHEMAS_TABLE, { uid });
        if (row) {
          await db.delete(SCHEMAS_TABLE, (row as { id: number }).id);
        }

        // Drop the data table
        if (schema.collectionName) {
          try {
            await db.dropTable(schema.collectionName);
          } catch {
            // Table may not exist
          }
        }

        if (getProjectRoot) deleteSchemaFile(uid, getProjectRoot());
        schemaRegistry.delete(uid);
        res.json({ message: `Content type "${uid}" deleted successfully` });
      } catch (err) {
        next(err);
      }
    },
  );

  // ---- Database Info ----

  /**
   * GET /api/admin/database/info
   */
  router.get("/database/info", (req: Request, res: Response) => {
    res.json({
      data: {
        connected: db.isConnected(),
        contentTypes: schemaRegistry.getCollectionTypes().length,
        singleTypes: schemaRegistry.getSingleTypes().length,
      },
    });
  });

  // ---- Stats ----

  /**
   * GET /api/admin/stats
   */
  router.get(
    "/stats",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schemas = schemaRegistry.getAll();
        const stats = await Promise.all(
          schemas.map(async (schema) => {
            const count = await db.count(schema.collectionName).catch(() => 0);
            return { uid: schema.uid, displayName: schema.displayName, count };
          }),
        );
        res.json({ data: stats });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
