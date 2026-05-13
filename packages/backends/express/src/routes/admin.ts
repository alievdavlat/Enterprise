import { Router, Request, Response, NextFunction } from "express";
import type { SchemaRegistry } from "@enterprise/core";
import type { DatabaseAdapter } from "@enterprise/database";
import type { ContentTypeSchema } from "@enterprise/types";
import bcrypt from "bcryptjs";
import { ensureTableForSchema } from "../loadSchemasFromDb";
import { syncSchemaToFile, deleteSchemaFile } from "../schemaSync";

const SCHEMAS_TABLE = "enterprise_content_type_schemas";

function paramId(p: string | number | string[] | undefined): number | string {
  const s = Array.isArray(p) ? p[0] : p;
  if (s === undefined) return 0;
  const n = Number(s);
  return Number.isNaN(n) || (n === 0 && s !== "0") ? s : n;
}

export function createAdminRouter(
  schemaRegistry: SchemaRegistry,
  db: DatabaseAdapter,
  options?: {
    onSchemaRegistered?: (schema: ContentTypeSchema) => void;
    /** If set, schemas are synced to project schema/ folder (schema-as-code for deploy). */
    getProjectRoot?: () => string;
    /** Discovered runtime artifacts (plugins, middlewares, cron, services). */
    getDiscoveredArtifacts?: () => {
      plugins: { registered: string[]; disabled: string[] };
      middlewares: { resolved: string[]; unresolved: string[]; discovered: string[] };
      cron: { name: string; schedule: string; running: boolean }[];
      services: { registered: string[]; skipped: string[] };
    };
    /** Re-sync PermissionManager from `enterprise_permissions` after role edits. */
    reloadPermissions?: () => Promise<void> | void;
    /** Re-evaluate backup schedule (register/unregister cron) after admin saves it. */
    applyBackupSchedule?: () => Promise<void> | void;
    /** Run a backup right now; returns the written file path. */
    runBackupNow?: () => Promise<string | null>;
    /** List existing backup files so the UI can render history. */
    listBackups?: () => Promise<{ name: string; size: number; createdAt: string }[]>;
    /** Rebuild the user-defined cron jobs after CRUD on enterprise_user_cron_jobs. */
    reloadUserCronJobs?: () => Promise<void> | void;
    /** Rebuild the user-defined middlewares after CRUD on enterprise_user_middlewares. */
    reloadUserMiddlewares?: () => Promise<void> | void;
    /** Rebuild the user-defined routes after CRUD on enterprise_user_routes. */
    reloadUserRoutes?: () => Promise<void> | void;
    /** Rebuild user services / lifecycles / extensions / plugins after CRUD. */
    reloadUserServices?: () => Promise<void> | void;
    reloadUserLifecycles?: () => Promise<void> | void;
    reloadUserExtensions?: () => Promise<void> | void;
    reloadUserPlugins?: () => Promise<void> | void;
    /** Live PermissionManager — exposed for the /actions and /conditions endpoints. */
    permissionManager?: import("@enterprise/core").PermissionManager;
  },
): Router {
  const router = Router();
  const getProjectRoot = options?.getProjectRoot;
  const getDiscoveredArtifacts = options?.getDiscoveredArtifacts;
  const reloadPermissions = options?.reloadPermissions;
  const reloadUserCronJobs = options?.reloadUserCronJobs;
  const reloadUserMiddlewares = options?.reloadUserMiddlewares;
  const reloadUserRoutes = options?.reloadUserRoutes;
  const reloadUserServices = options?.reloadUserServices;
  const reloadUserLifecycles = options?.reloadUserLifecycles;
  const reloadUserExtensions = options?.reloadUserExtensions;
  const reloadUserPlugins = options?.reloadUserPlugins;

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

  // ---- Export / Import (schema + content for deploy, backup, restore) ----

  /**
   * GET /api/admin/export?includeContent=1
   * Export all schemas and optionally all content (entries). Use for backup or to restore on another server.
   */
  router.get(
    "/export",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const includeContent = req.query.includeContent === "1" || req.query.includeContent === "true";
        const includeUploads = req.query.includeUploads === "1" || req.query.includeUploads === "true";
        const schemas = schemaRegistry.getAll();
        const payload: {
          version: number;
          exportedAt: string;
          schemas: ContentTypeSchema[];
          content?: Record<string, unknown[]>;
          uploads?: unknown[];
          stats?: { schemas: number; contentEntries: number; uploads: number };
        } = {
          version: 1,
          exportedAt: new Date().toISOString(),
          schemas,
        };
        let contentEntryCount = 0;
        if (includeContent) {
          const content: Record<string, unknown[]> = {};
          const collectionTypes = schemaRegistry.getCollectionTypes();
          const singleTypes = schemaRegistry.getSingleTypes();
          for (const schema of collectionTypes) {
            const rows: unknown[] = [];
            let page = 1;
            const pageSize = 500;
            let hasMore = true;
            while (hasMore) {
              try {
                const result = await db.findMany(schema.collectionName, { pagination: { page, pageSize } });
                rows.push(...(result.data || []));
                hasMore = (result.data?.length ?? 0) === pageSize;
                page++;
              } catch {
                // Table may not exist yet (freshly-registered schema); skip it.
                hasMore = false;
              }
            }
            content[schema.collectionName] = rows;
            contentEntryCount += rows.length;
          }
          for (const schema of singleTypes) {
            try {
              const result = await db.findMany(schema.collectionName, { pagination: { page: 1, pageSize: 1 } });
              const rows = result.data?.length ? (result.data as unknown[]) : [];
              content[schema.collectionName] = rows;
              contentEntryCount += rows.length;
            } catch {
              content[schema.collectionName] = [];
            }
          }
          payload.content = content;
        }
        let uploadCount = 0;
        if (includeUploads) {
          // Media table metadata only — actual files stay on disk / cloud
          // provider. Restoring on a fresh server still resolves URLs as long
          // as the files are present at the same paths.
          try {
            if (await db.tableExists("enterprise_media")) {
              const rows: unknown[] = [];
              let page = 1;
              const pageSize = 500;
              let hasMore = true;
              while (hasMore) {
                const result = await db.findMany("enterprise_media", { pagination: { page, pageSize } });
                rows.push(...(result.data || []));
                hasMore = (result.data?.length ?? 0) === pageSize;
                page++;
              }
              payload.uploads = rows;
              uploadCount = rows.length;
            } else {
              payload.uploads = [];
            }
          } catch {
            payload.uploads = [];
          }
        }
        payload.stats = {
          schemas: schemas.length,
          contentEntries: contentEntryCount,
          uploads: uploadCount,
        };
        res.setHeader("Content-Disposition", `attachment; filename="enterprise-export-${Date.now()}.json"`);
        res.json(payload);
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * POST /api/admin/import
   * Restore schemas and optionally content from a previous export. Use after deploy to a new server.
   */
  router.post(
    "/import",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = req.body as { version?: number; schemas?: ContentTypeSchema[]; content?: Record<string, unknown[]> };
        if (!body?.schemas || !Array.isArray(body.schemas)) {
          return res.status(400).json({ error: { message: "Invalid export payload: schemas array required" } });
        }
        for (const schema of body.schemas) {
          if (!schema?.uid) continue;
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
        }
        let contentRestored = 0;
        if (body.content && typeof body.content === "object") {
          for (const [collectionName, entries] of Object.entries(body.content)) {
            if (!Array.isArray(entries) || !schemaRegistry.getAll().some((s) => s.collectionName === collectionName)) continue;
            for (const entry of entries) {
              const doc = entry as Record<string, unknown>;
              const { id: _id, ...rest } = doc;
              try {
                await db.create(collectionName, rest as Record<string, unknown>);
                contentRestored++;
              } catch (e) {
                // Skip duplicate or invalid rows
              }
            }
          }
        }
        // Restore media table rows when present. Files themselves aren't
        // copied — we assume the user moves /uploads alongside the JSON.
        let uploadsRestored = 0;
        const uploads = (body as { uploads?: unknown[] }).uploads;
        if (Array.isArray(uploads) && (await db.tableExists("enterprise_media"))) {
          for (const entry of uploads) {
            const doc = entry as Record<string, unknown>;
            const { id: _id, ...rest } = doc;
            try {
              await db.create("enterprise_media", rest);
              uploadsRestored++;
            } catch {
              /* duplicate hash or schema mismatch — skip */
            }
          }
        }
        res.json({
          message: "Import completed",
          schemasRestored: body.schemas.length,
          contentRestored,
          uploadsRestored,
        });
      } catch (err) {
        next(err);
      }
    },
  );

  // ---- Scheduled backup (Settings > Data Backup toggle + interval) ----
  // Config schema: { enabled, frequency: "hourly"|"daily"|"weekly"|"cron",
  //                  cron?: "<5-field>", includeContent, includeUploads,
  //                  retention?: number (keep last N files) }
  // Persisted in core_store under key admin::backup-schedule; the cron job
  // wiring lives in EnterpriseServer.applyBackupSchedule() so it can attach
  // to the live CronManager.
  const BACKUP_STORE_KEY = "admin::backup-schedule";

  router.get("/backup-schedule", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const row = await db.findOneBy(STORE_TABLE, { key: BACKUP_STORE_KEY });
      const value = (row as { value?: string } | null)?.value;
      let parsed: Record<string, unknown> = {
        enabled: false,
        frequency: "daily",
        includeContent: true,
        includeUploads: false,
        retention: 7,
      };
      if (typeof value === "string" && (value.startsWith("{") || value.startsWith("["))) {
        try {
          parsed = { ...parsed, ...JSON.parse(value) };
        } catch {
          /* fall through */
        }
      }
      res.json({ data: parsed });
    } catch (err) {
      next(err);
    }
  });

  router.post("/backup-schedule", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const valueStr = JSON.stringify(req.body ?? {});
      const row = await db.findOneBy(STORE_TABLE, { key: BACKUP_STORE_KEY });
      if (row) {
        await db.update(STORE_TABLE, (row as { id: number }).id, { value: valueStr });
      } else {
        await db.create(STORE_TABLE, {
          key: BACKUP_STORE_KEY,
          value: valueStr,
          type: null,
          environment: null,
        });
      }
      // Notify the live server so it can register/unregister the cron job.
      try {
        await options?.applyBackupSchedule?.();
      } catch (err) {
        console.warn("[admin] applyBackupSchedule failed:", err);
      }
      res.json({ data: { key: BACKUP_STORE_KEY } });
    } catch (err) {
      next(err);
    }
  });

  // Manual trigger — runs the same export pipeline as the scheduled job and
  // returns the path the file was written to. Useful for "Run now" buttons
  // in the admin without waiting for the cron tick.
  router.post("/backup-now", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const filePath = await options?.runBackupNow?.();
      if (!filePath) {
        return res.status(503).json({
          error: {
            status: 503,
            message: "Backup service not available in this server build",
          },
        });
      }
      res.json({ data: { filePath } });
    } catch (err) {
      next(err);
    }
  });

  // List existing backup files so the UI can show "last 7 backups".
  router.get("/backups", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const files = await options?.listBackups?.();
      res.json({ data: files ?? [] });
    } catch (err) {
      next(err);
    }
  });

  // ---- User-defined cron jobs (no-code builder, Phase 16.1) ----
  // The admin UI lets the user write a cron entry (name, schedule, JS code)
  // and the server compiles + registers it without a restart. See
  // EnterpriseServer.applyUserCronJobs for the compile pipeline.
  const USER_CRON_TABLE = "enterprise_user_cron_jobs";

  router.get("/cron-jobs", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await db.tableExists(USER_CRON_TABLE))) {
        return res.json({ data: [] });
      }
      const result = await db.findMany(USER_CRON_TABLE, {
        pagination: { page: 1, pageSize: 500 },
        sort: [{ field: "created_at", direction: "desc" }],
      });
      res.json({ data: result.data });
    } catch (err) {
      next(err);
    }
  });

  router.post("/cron-jobs", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, schedule, code, enabled = true, description } = req.body ?? {};
      if (!name || !schedule || !code) {
        return res.status(400).json({
          error: { status: 400, message: "name, schedule, and code are required" },
        });
      }
      // Reject names that collide with the user:: prefix space we own.
      const safeName = String(name).replace(/[^a-zA-Z0-9_-]/g, "_");
      const existing = await db.findOneBy(USER_CRON_TABLE, { name: safeName });
      if (existing) {
        return res.status(409).json({
          error: { status: 409, message: `Cron "${safeName}" already exists` },
        });
      }
      // Compile-test before storing so bad code is rejected up front.
      try {
        new Function("app", "ctx", `return (async () => { ${code} })()`);
      } catch (err) {
        return res.status(400).json({
          error: {
            status: 400,
            message: `Compile error: ${err instanceof Error ? err.message : String(err)}`,
          },
        });
      }
      const row = await db.create(USER_CRON_TABLE, {
        name: safeName,
        schedule,
        code,
        enabled: !!enabled,
        description: description ?? null,
      });
      try {
        await reloadUserCronJobs?.();
      } catch (err) {
        console.warn("[admin] reloadUserCronJobs failed:", err);
      }
      res.status(201).json({ data: row });
    } catch (err) {
      next(err);
    }
  });

  router.put("/cron-jobs/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = paramId(req.params.id);
      const { schedule, code, enabled, description, name } = req.body ?? {};
      const patch: Record<string, unknown> = {};
      if (schedule !== undefined) patch.schedule = schedule;
      if (code !== undefined) {
        try {
          new Function("app", "ctx", `return (async () => { ${code} })()`);
        } catch (err) {
          return res.status(400).json({
            error: {
              status: 400,
              message: `Compile error: ${err instanceof Error ? err.message : String(err)}`,
            },
          });
        }
        patch.code = code;
      }
      if (enabled !== undefined) patch.enabled = !!enabled;
      if (description !== undefined) patch.description = description;
      if (name !== undefined) patch.name = String(name).replace(/[^a-zA-Z0-9_-]/g, "_");
      await db.update(USER_CRON_TABLE, id, patch);
      try {
        await reloadUserCronJobs?.();
      } catch (err) {
        console.warn("[admin] reloadUserCronJobs failed:", err);
      }
      const updated = await db.findOne(USER_CRON_TABLE, id);
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  });

  router.delete("/cron-jobs/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = paramId(req.params.id);
      await db.delete(USER_CRON_TABLE, id);
      try {
        await reloadUserCronJobs?.();
      } catch (err) {
        console.warn("[admin] reloadUserCronJobs failed:", err);
      }
      res.json({ data: { ok: true } });
    } catch (err) {
      next(err);
    }
  });

  // ---- User-defined middlewares (Phase 16.2) ----
  const USER_MIDDLEWARE_TABLE = "enterprise_user_middlewares";

  router.get("/middlewares-list", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await db.tableExists(USER_MIDDLEWARE_TABLE))) return res.json({ data: [] });
      const result = await db.findMany(USER_MIDDLEWARE_TABLE, {
        pagination: { page: 1, pageSize: 500 },
        sort: [{ field: "priority", direction: "asc" }],
      });
      res.json({ data: result.data });
    } catch (err) {
      next(err);
    }
  });

  router.post("/middlewares-list", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, code, enabled = true, priority = 100, description } = req.body ?? {};
      if (!name || !code) {
        return res.status(400).json({
          error: { status: 400, message: "name and code are required" },
        });
      }
      const safeName = String(name).replace(/[^a-zA-Z0-9_-]/g, "_");
      const existing = await db.findOneBy(USER_MIDDLEWARE_TABLE, { name: safeName });
      if (existing) {
        return res.status(409).json({
          error: { status: 409, message: `Middleware "${safeName}" already exists` },
        });
      }
      try {
        new Function("req", "res", "next", `return (async () => { ${code} })()`);
      } catch (err) {
        return res.status(400).json({
          error: {
            status: 400,
            message: `Compile error: ${err instanceof Error ? err.message : String(err)}`,
          },
        });
      }
      const row = await db.create(USER_MIDDLEWARE_TABLE, {
        name: safeName,
        code,
        enabled: !!enabled,
        priority: Number(priority) || 100,
        description: description ?? null,
      });
      try {
        await reloadUserMiddlewares?.();
      } catch (err) {
        console.warn("[admin] reloadUserMiddlewares failed:", err);
      }
      res.status(201).json({ data: row });
    } catch (err) {
      next(err);
    }
  });

  router.put("/middlewares-list/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = paramId(req.params.id);
      const { code, enabled, priority, description, name } = req.body ?? {};
      const patch: Record<string, unknown> = {};
      if (code !== undefined) {
        try {
          new Function("req", "res", "next", `return (async () => { ${code} })()`);
        } catch (err) {
          return res.status(400).json({
            error: {
              status: 400,
              message: `Compile error: ${err instanceof Error ? err.message : String(err)}`,
            },
          });
        }
        patch.code = code;
      }
      if (enabled !== undefined) patch.enabled = !!enabled;
      if (priority !== undefined) patch.priority = Number(priority) || 100;
      if (description !== undefined) patch.description = description;
      if (name !== undefined) patch.name = String(name).replace(/[^a-zA-Z0-9_-]/g, "_");
      await db.update(USER_MIDDLEWARE_TABLE, id, patch);
      try {
        await reloadUserMiddlewares?.();
      } catch (err) {
        console.warn("[admin] reloadUserMiddlewares failed:", err);
      }
      const updated = await db.findOne(USER_MIDDLEWARE_TABLE, id);
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  });

  router.delete("/middlewares-list/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = paramId(req.params.id);
      await db.delete(USER_MIDDLEWARE_TABLE, id);
      try {
        await reloadUserMiddlewares?.();
      } catch (err) {
        console.warn("[admin] reloadUserMiddlewares failed:", err);
      }
      res.json({ data: { ok: true } });
    } catch (err) {
      next(err);
    }
  });

  // ---- User-defined custom routes (Phase 16.3) ----
  const USER_ROUTE_TABLE = "enterprise_user_routes";
  const HTTP_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "ALL"]);

  router.get("/user-routes", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await db.tableExists(USER_ROUTE_TABLE))) return res.json({ data: [] });
      const result = await db.findMany(USER_ROUTE_TABLE, {
        pagination: { page: 1, pageSize: 500 },
        sort: [{ field: "created_at", direction: "desc" }],
      });
      res.json({ data: result.data });
    } catch (err) {
      next(err);
    }
  });

  router.post("/user-routes", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, method, path, code, enabled = true, description } = req.body ?? {};
      if (!name || !method || !path || !code) {
        return res.status(400).json({
          error: { status: 400, message: "name, method, path, and code are required" },
        });
      }
      const upperMethod = String(method).toUpperCase();
      if (!HTTP_METHODS.has(upperMethod)) {
        return res.status(400).json({
          error: { status: 400, message: `method must be one of: ${Array.from(HTTP_METHODS).join(", ")}` },
        });
      }
      const safeName = String(name).replace(/[^a-zA-Z0-9_-]/g, "_");
      const existing = await db.findOneBy(USER_ROUTE_TABLE, { name: safeName });
      if (existing) {
        return res.status(409).json({
          error: { status: 409, message: `Route "${safeName}" already exists` },
        });
      }
      try {
        new Function("req", "res", "ctx", `return (async () => { ${code} })()`);
      } catch (err) {
        return res.status(400).json({
          error: {
            status: 400,
            message: `Compile error: ${err instanceof Error ? err.message : String(err)}`,
          },
        });
      }
      const row = await db.create(USER_ROUTE_TABLE, {
        name: safeName,
        method: upperMethod,
        path: String(path),
        code,
        enabled: !!enabled,
        description: description ?? null,
      });
      try {
        await reloadUserRoutes?.();
      } catch (err) {
        console.warn("[admin] reloadUserRoutes failed:", err);
      }
      res.status(201).json({ data: row });
    } catch (err) {
      next(err);
    }
  });

  router.put("/user-routes/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = paramId(req.params.id);
      const { method, path, code, enabled, description, name } = req.body ?? {};
      const patch: Record<string, unknown> = {};
      if (method !== undefined) {
        const upper = String(method).toUpperCase();
        if (!HTTP_METHODS.has(upper)) {
          return res.status(400).json({
            error: { status: 400, message: `method must be one of: ${Array.from(HTTP_METHODS).join(", ")}` },
          });
        }
        patch.method = upper;
      }
      if (path !== undefined) patch.path = String(path);
      if (code !== undefined) {
        try {
          new Function("req", "res", "ctx", `return (async () => { ${code} })()`);
        } catch (err) {
          return res.status(400).json({
            error: {
              status: 400,
              message: `Compile error: ${err instanceof Error ? err.message : String(err)}`,
            },
          });
        }
        patch.code = code;
      }
      if (enabled !== undefined) patch.enabled = !!enabled;
      if (description !== undefined) patch.description = description;
      if (name !== undefined) patch.name = String(name).replace(/[^a-zA-Z0-9_-]/g, "_");
      await db.update(USER_ROUTE_TABLE, id, patch);
      try {
        await reloadUserRoutes?.();
      } catch (err) {
        console.warn("[admin] reloadUserRoutes failed:", err);
      }
      const updated = await db.findOne(USER_ROUTE_TABLE, id);
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  });

  router.delete("/user-routes/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = paramId(req.params.id);
      await db.delete(USER_ROUTE_TABLE, id);
      try {
        await reloadUserRoutes?.();
      } catch (err) {
        console.warn("[admin] reloadUserRoutes failed:", err);
      }
      res.json({ data: { ok: true } });
    } catch (err) {
      next(err);
    }
  });

  // ---- Generic builder CRUD helper (services / lifecycles / extensions / plugins) ----
  // Each builder resource follows the same shape: name unique + code (or
  // manifest) + enabled + description + per-resource extras. This helper
  // mounts /admin/<routePath> with GET / POST / PUT / DELETE and runs a
  // compile-test before persisting so bad snippets are rejected up front.
  function mountBuilderCrud(opts: {
    routePath: string;
    table: string;
    /** Extra fields to accept on POST/PUT beyond name/code/enabled/description. */
    extraFields?: string[];
    /** Try to compile the code with this signature; throws on syntax error. */
    compile?: (code: string) => unknown;
    /** Called after every successful CRUD to hot-reload the in-memory registry. */
    reload?: () => Promise<void> | void;
    /** Used in error messages. */
    label: string;
  }) {
    const { routePath, table, extraFields = [], compile, reload, label } = opts;
    type CruderResult = { ok: true; payload: Record<string, unknown> } | { ok: false; status: number; message: string };
    const cruder = async (req: Request, body: Record<string, unknown>, isUpdate = false): Promise<CruderResult> => {
      const payload: Record<string, unknown> = {};
      if (typeof body.name === "string") payload.name = String(body.name).replace(/[^a-zA-Z0-9_.\-]/g, "_");
      if (typeof body.description !== "undefined") payload.description = body.description ?? null;
      if (typeof body.enabled !== "undefined") payload.enabled = !!body.enabled;
      if (typeof body.code === "string") {
        if (compile) {
          try {
            compile(body.code);
          } catch (err) {
            return { ok: false, status: 400, message: `Compile error: ${err instanceof Error ? err.message : String(err)}` };
          }
        }
        payload.code = body.code;
      }
      for (const f of extraFields) {
        if (typeof body[f] !== "undefined") payload[f] = body[f];
      }
      if (!isUpdate) {
        if (!payload.name) return { ok: false, status: 400, message: "name is required" };
        if (!payload.code && extraFields.indexOf("manifest") < 0) {
          return { ok: false, status: 400, message: "code is required" };
        }
      }
      return { ok: true, payload };
    };

    router.get(`/${routePath}`, async (_req: Request, res: Response, next: NextFunction) => {
      try {
        if (!(await db.tableExists(table))) return res.json({ data: [] });
        const result = await db.findMany(table, {
          pagination: { page: 1, pageSize: 500 },
          sort: [{ field: "created_at", direction: "desc" }],
        });
        res.json({ data: result.data });
      } catch (err) { next(err); }
    });

    router.post(`/${routePath}`, async (req: Request, res: Response, next: NextFunction) => {
      try {
        const built = await cruder(req, req.body ?? {});
        if (!built.ok) return res.status(built.status).json({ error: { status: built.status, message: built.message } });
        const existing = await db.findOneBy(table, { name: built.payload.name });
        if (existing) {
          return res.status(409).json({ error: { status: 409, message: `${label} "${built.payload.name}" already exists` } });
        }
        const row = await db.create(table, built.payload);
        try { await reload?.(); } catch (err) { console.warn(`[admin] reload ${label} failed:`, err); }
        res.status(201).json({ data: row });
      } catch (err) { next(err); }
    });

    router.put(`/${routePath}/:id`, async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = paramId(req.params.id);
        const built = await cruder(req, req.body ?? {}, true);
        if (!built.ok) return res.status(built.status).json({ error: { status: built.status, message: built.message } });
        await db.update(table, id, built.payload);
        try { await reload?.(); } catch (err) { console.warn(`[admin] reload ${label} failed:`, err); }
        const updated = await db.findOne(table, id);
        res.json({ data: updated });
      } catch (err) { next(err); }
    });

    router.delete(`/${routePath}/:id`, async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = paramId(req.params.id);
        await db.delete(table, id);
        try { await reload?.(); } catch (err) { console.warn(`[admin] reload ${label} failed:`, err); }
        res.json({ data: { ok: true } });
      } catch (err) { next(err); }
    });
  }

  // Services (Phase 16.4) — code is wrapped in `async (app, args) => { ... }`.
  mountBuilderCrud({
    routePath: "user-services",
    table: "enterprise_user_services",
    compile: (code) => new Function("app", "args", `return (async () => { ${code} })()`),
    reload: reloadUserServices,
    label: "Service",
  });

  // Lifecycles (Phase 16.5) — model + event extras; code receives ctx.
  mountBuilderCrud({
    routePath: "user-lifecycles",
    table: "enterprise_user_lifecycles",
    extraFields: ["model", "event"],
    compile: (code) => new Function("ctx", `return (async () => { ${code} })()`),
    reload: reloadUserLifecycles,
    label: "Lifecycle",
  });

  // Extensions (Phase 16.8) — target + phase extras; code receives ctx.
  mountBuilderCrud({
    routePath: "user-extensions",
    table: "enterprise_user_extensions",
    extraFields: ["target", "phase"],
    compile: (code) => new Function("ctx", `return (async () => { ${code} })()`),
    reload: reloadUserExtensions,
    label: "Extension",
  });

  // Plugins (Phase 16.6) — manifest JSON instead of code; bundle of names.
  mountBuilderCrud({
    routePath: "user-plugins",
    table: "enterprise_user_plugins",
    extraFields: ["version", "manifest"],
    reload: reloadUserPlugins,
    label: "Plugin",
  });

  // ---- Migrations runner (Phase 16.10) ----
  // Surfaces the Phase 3 CLI MigrationRunner over HTTP so admins can list,
  // apply and roll back migrations from the UI without an SSH session.
  router.get("/migrations", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const projectRoot = getProjectRoot?.();
      if (!projectRoot) {
        return res.status(503).json({ error: { status: 503, message: "Migrations require a project root" } });
      }
      const { MigrationRunner } = await import("@enterprise/database");
      const path = await import("path");
      const runner = new MigrationRunner({
        db: db as never,
        migrationsDir: path.join(projectRoot, "database", "migrations"),
      });
      const status = await runner.status();
      res.json({ data: status });
    } catch (err) {
      next(err);
    }
  });

  router.post("/migrations/up", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const projectRoot = getProjectRoot?.();
      if (!projectRoot) {
        return res.status(503).json({ error: { status: 503, message: "Migrations require a project root" } });
      }
      const { MigrationRunner } = await import("@enterprise/database");
      const path = await import("path");
      const runner = new MigrationRunner({
        db: db as never,
        migrationsDir: path.join(projectRoot, "database", "migrations"),
      });
      const applied = await runner.up();
      res.json({ data: { applied } });
    } catch (err) {
      next(err);
    }
  });

  router.post("/migrations/down", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectRoot = getProjectRoot?.();
      if (!projectRoot) {
        return res.status(503).json({ error: { status: 503, message: "Migrations require a project root" } });
      }
      const { MigrationRunner } = await import("@enterprise/database");
      const path = await import("path");
      const runner = new MigrationRunner({
        db: db as never,
        migrationsDir: path.join(projectRoot, "database", "migrations"),
      });
      const steps = Math.max(1, Number(req.body?.steps) || 1);
      const rolled = await runner.down(steps);
      res.json({ data: { rolled } });
    } catch (err) {
      next(err);
    }
  });

  router.post("/migrations/create", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectRoot = getProjectRoot?.();
      if (!projectRoot) {
        return res.status(503).json({ error: { status: 503, message: "Migrations require a project root" } });
      }
      const name = String(req.body?.name ?? "").trim();
      if (!name) {
        return res.status(400).json({ error: { status: 400, message: "name is required" } });
      }
      const { buildMigrationFilename, migrationTemplate } = await import("@enterprise/database");
      const path = await import("path");
      const fs = await import("fs");
      const dir = path.join(projectRoot, "database", "migrations");
      await fs.promises.mkdir(dir, { recursive: true });
      const file = path.join(dir, buildMigrationFilename(name));
      if (fs.existsSync(file)) {
        return res.status(409).json({ error: { status: 409, message: "File already exists" } });
      }
      await fs.promises.writeFile(file, migrationTemplate(), "utf8");
      res.status(201).json({ data: { path: file } });
    } catch (err) {
      next(err);
    }
  });

  // ---- ACL: actions + conditions catalog (Phase 17) ----
  // Used by the admin Roles editor to render the full matrix — built-in
  // Strapi verbs, bulk variants, plugin-registered custom actions, and
  // every action already referenced by a saved permission rule.
  router.get("/actions", (_req: Request, res: Response) => {
    const pm = options?.permissionManager;
    const actions = pm ? pm.listKnownActions() : [];
    // Also surface the per-CT action set so the UI can group by subject.
    const subjects = schemaRegistry.getAll().map((s) => ({
      uid: s.uid,
      displayName: s.displayName,
      kind: s.kind,
    }));
    res.json({ data: { actions, subjects } });
  });

  router.get("/conditions", (_req: Request, res: Response) => {
    const pm = options?.permissionManager;
    res.json({ data: pm ? pm.listConditions() : [] });
  });

  // ---- OAuth / Social auth providers (Phase 19) ----
  const AUTH_PROVIDERS_TABLE = "enterprise_auth_providers";

  router.get("/auth-providers", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const { listOAuthPresets } = await import("./oauth-providers");
      if (!(await db.tableExists(AUTH_PROVIDERS_TABLE))) {
        return res.json({ data: { presets: listOAuthPresets(), configured: [] } });
      }
      const rows = (
        await db.findMany(AUTH_PROVIDERS_TABLE, { pagination: { page: 1, pageSize: 100 } })
      ).data;
      // Strip clientSecret from the list response so it can't leak through
      // the admin UI logs / network panel. The per-id GET (below) returns it
      // when the admin actually needs to edit.
      const safe = (rows as Array<{ clientSecret?: string | null }>).map((r) => ({
        ...r,
        clientSecret: r.clientSecret ? "" : null,
      }));
      res.json({ data: { presets: listOAuthPresets(), configured: safe } });
    } catch (err) {
      next(err);
    }
  });

  router.put("/auth-providers/:name", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { getOAuthPreset } = await import("./oauth-providers");
      const name = String(req.params.name).toLowerCase();
      const { enabled, clientId, clientSecret, scope, redirectUri, allowedRedirects, isCustom, customConfig } = req.body ?? {};
      // Allow saving a row when (a) it's a known preset, OR (b) the caller
      // marked it as custom and supplied a config shape. Strapi exposes only
      // the curated list; we let admins ship a new IdP without redeploy.
      const preset = getOAuthPreset(name);
      if (!preset && !isCustom) {
        return res.status(404).json({ error: { status: 404, message: "Unknown provider preset; pass isCustom=true with customConfig to register a new one" } });
      }
      const existing = (await db.findOneBy(AUTH_PROVIDERS_TABLE, { name })) as
        | { id: number; clientSecret?: string | null }
        | null;
      const payload: Record<string, unknown> = {
        name,
        enabled: !!enabled,
        clientId: clientId ?? null,
        // Empty string from the UI means "leave existing secret alone" — only
        // overwrite when the admin types a new value.
        clientSecret: clientSecret === "" || clientSecret === undefined
          ? existing?.clientSecret ?? null
          : clientSecret,
        scope: scope ?? null,
        redirectUri: redirectUri ?? null,
        allowedRedirects: allowedRedirects ?? null,
        isCustom: !!isCustom,
        customConfig: customConfig ? (typeof customConfig === "string" ? customConfig : JSON.stringify(customConfig)) : null,
      };
      if (existing) {
        await db.update(AUTH_PROVIDERS_TABLE, existing.id, payload);
      } else {
        await db.create(AUTH_PROVIDERS_TABLE, payload);
      }
      const row = await db.findOneBy(AUTH_PROVIDERS_TABLE, { name });
      res.json({ data: row });
    } catch (err) {
      next(err);
    }
  });

  // ---- Users Management ----

  /**
   * GET /api/admin/users
   */
  router.get(
    "/users",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await db.findMany("enterprise_users", {
          pagination: { page: 1, pageSize: 100 },
        });
        const safeData = result.data.map((u: any) => {
          const { password: _, ...user } = u;
          return user;
        });
        res.json({ data: safeData, meta: result.meta });
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * POST /api/admin/users
   */
  router.post(
    "/users",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email, username, firstName, lastName, role } = req.body;
        const bcrypt = await import("bcryptjs");
        const password = await bcrypt.hash("Welcome1!", 10);
        const user = await db.create("enterprise_users", {
          email,
          username: username || email?.split("@")[0],
          firstName: firstName || "",
          lastName: lastName || "",
          role: role || "authenticated",
          password,
          isActive: true,
        });
        const { password: _, ...safeUser } = user;
        res.status(201).json({ data: safeUser });
      } catch (err) {
        next(err);
      }
    },
  );

  // ---- Roles ----

  /**
   * GET /api/admin/roles
   */
  router.get(
    "/roles",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await db.findMany("enterprise_roles", {
          pagination: { page: 1, pageSize: 100 },
        });
        res.json({ data: result.data, meta: result.meta });
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * POST /api/admin/roles
   */
  router.post(
    "/roles",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { name, description } = req.body;
        const role = await db.create("enterprise_roles", {
          name: name || "New role",
          description: description || "",
        });
        res.status(201).json({ data: role });
      } catch (err) {
        next(err);
      }
    },
  );

  // ---- API Tokens ----

  /**
   * GET /api/admin/api-tokens
   */
  router.get(
    "/api-tokens",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await db.findMany("enterprise_api_tokens", {
          pagination: { page: 1, pageSize: 100 },
        });
        res.json({ data: result.data, meta: result.meta });
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * POST /api/admin/api-tokens
   */
  router.post(
    "/api-tokens",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { v4: uuidv4 } = await import("uuid");
        const { name, description, type, lifespan } = req.body;
        if (!name || typeof name !== "string") {
          return res
            .status(400)
            .json({ error: { message: "name is required" } });
        }
        const token = await db.create("enterprise_api_tokens", {
          name,
          description: description || "",
          accessKey: uuidv4(),
          type: type || "read-only",
          lifespan: lifespan || null,
        });
        res.status(201).json({ data: token });
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * PUT /api/admin/api-tokens/:id
   * Update name, description, type or regenerate accessKey
   */
  router.put(
    "/api-tokens/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
          return res
            .status(400)
            .json({ error: { message: "invalid id" } });
        }
        const { name, description, type, lifespan, regenerate } = req.body;
        const patch: Record<string, unknown> = {};
        if (typeof name === "string") patch.name = name;
        if (typeof description === "string") patch.description = description;
        if (typeof type === "string") patch.type = type;
        if (lifespan === null || typeof lifespan === "string")
          patch.lifespan = lifespan;
        if (regenerate) {
          const { v4: uuidv4 } = await import("uuid");
          patch.accessKey = uuidv4();
        }
        const updated = await db.update("enterprise_api_tokens", id, patch);
        res.json({ data: updated });
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * DELETE /api/admin/api-tokens/:id
   */
  router.delete(
    "/api-tokens/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
          return res
            .status(400)
            .json({ error: { message: "invalid id" } });
        }
        await db.delete("enterprise_api_tokens", id);
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },
  );

  // ---- Core Store (Strapi-style key-value for settings) ----

  const STORE_TABLE = "enterprise_core_store_settings";

  /**
   * GET /api/admin/store?key=...
   * Get a setting by key
   */
  router.get("/store", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = req.query.key as string;
      if (!key) {
        return res.status(400).json({ error: { message: "key is required" } });
      }
      const row = await db.findOneBy(STORE_TABLE, { key });
      if (!row) {
        return res.status(404).json({ error: { message: "Not found" } });
      }
      const value = (row as { value?: string }).value;
      let parsed: unknown = value;
      try {
        if (typeof value === "string" && (value.startsWith("{") || value.startsWith("["))) {
          parsed = JSON.parse(value);
        }
      } catch {
        /* keep string */
      }
      res.json({ data: { key, value: parsed } });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/admin/store
   * Set a setting (body: { key, value, type?, environment? })
   */
  router.post("/store", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { key, value, type, environment } = req.body;
      if (!key) {
        return res.status(400).json({ error: { message: "key is required" } });
      }
      const valueStr = typeof value === "string" ? value : JSON.stringify(value ?? null);
      const row = await db.findOneBy(STORE_TABLE, { key });
      if (row) {
        await db.update(STORE_TABLE, (row as { id: number }).id, {
          value: valueStr,
          type: type ?? (row as { type?: string }).type,
          environment: environment ?? (row as { environment?: string }).environment,
        });
      } else {
        await db.create(STORE_TABLE, {
          key,
          value: valueStr,
          type: type ?? null,
          environment: environment ?? null,
        });
      }
      res.json({ data: { key, value: valueStr } });
    } catch (err) {
      next(err);
    }
  });

  // ---- Transfer Tokens ----

  router.get(
    "/transfer-tokens",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await db.findMany("enterprise_transfer_tokens", {
          pagination: { page: 1, pageSize: 100 },
        });
        const data = (result.data as { accessKey?: string }[]).map((t) => {
          const { accessKey: _, ...rest } = t;
          return rest;
        });
        res.json({ data, meta: result.meta });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/transfer-tokens",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { v4: uuidv4 } = await import("uuid");
        const { name, description, permissions, lifespan } = req.body;
        const accessKey = uuidv4();
        const token = await db.create("enterprise_transfer_tokens", {
          name: name || "Transfer token",
          description: description || "",
          accessKey,
          permissions: typeof permissions === "string" ? permissions : JSON.stringify(permissions || []),
          lifespan: lifespan || null,
        });
        res.status(201).json({ data: token });
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    "/transfer-tokens/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = paramId(req.params.id);
        await db.delete("enterprise_transfer_tokens", id);
        res.json({ data: { id } });
      } catch (err) {
        next(err);
      }
    },
  );

  // ---- Audit Logs ----

  router.get(
    "/audit-logs",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 25));
        const result = await db.findMany("enterprise_audit_logs", {
          pagination: { page, pageSize },
          sort: [{ field: "created_at", direction: "desc" }],
        });
        res.json({ data: result.data, meta: result.meta });
      } catch (err) {
        next(err);
      }
    },
  );

  // ---- Review Workflows ----

  router.get(
    "/review-workflows",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await db.findMany("enterprise_review_workflows", {
          pagination: { page: 1, pageSize: 100 },
        });
        const workflows = result.data as { id: number }[];
        const withStages = await Promise.all(
          workflows.map(async (w) => {
            const stagesResult = await db.findMany("enterprise_review_workflow_stages", {
              filters: { workflowId: w.id },
              pagination: { page: 1, pageSize: 50 },
            });
            const stages = (stagesResult.data as { order?: number }[]).sort(
              (a, b) => (a.order ?? 0) - (b.order ?? 0),
            );
            return { ...w, stages };
          }),
        );
        res.json({ data: withStages, meta: result.meta });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/review-workflows",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { name, description, contentTypes, stages } = req.body;
        const workflow = await db.create("enterprise_review_workflows", {
          name: name || "Workflow",
          description: description || "",
          contentTypes: typeof contentTypes === "string" ? contentTypes : JSON.stringify(contentTypes || []),
        });
        const wfId = (workflow as { id: number }).id;
        if (Array.isArray(stages) && stages.length > 0) {
          for (let i = 0; i < stages.length; i++) {
            await db.create("enterprise_review_workflow_stages", {
              workflowId: wfId,
              name: stages[i].name || `Stage ${i + 1}`,
              order: stages[i].order ?? i,
            });
          }
        }
        const stagesResult = await db.findMany("enterprise_review_workflow_stages", {
          filters: { workflowId: wfId },
          pagination: { page: 1, pageSize: 50 },
        });
        const sorted = (stagesResult.data as { order?: number }[]).sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0),
        );
        res.status(201).json({ data: { ...workflow, stages: sorted } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.put(
    "/review-workflows/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = paramId(req.params.id);
        const { name, description, contentTypes, stages } = req.body;
        const payload: Record<string, unknown> = {};
        if (name !== undefined) payload.name = name;
        if (description !== undefined) payload.description = description;
        if (contentTypes !== undefined) payload.contentTypes = typeof contentTypes === "string" ? contentTypes : JSON.stringify(contentTypes || []);
        if (Object.keys(payload).length > 0) {
          await db.update("enterprise_review_workflows", id, payload);
        }
        if (Array.isArray(stages)) {
          const existing = await db.findMany("enterprise_review_workflow_stages", {
            filters: { workflowId: id },
            pagination: { page: 1, pageSize: 100 },
          });
          for (const row of existing.data as { id: number }[]) {
            await db.delete("enterprise_review_workflow_stages", row.id);
          }
          for (let i = 0; i < stages.length; i++) {
            await db.create("enterprise_review_workflow_stages", {
              workflowId: id,
              name: stages[i].name || `Stage ${i + 1}`,
              order: stages[i].order ?? i,
            });
          }
        }
        const workflow = await db.findOne("enterprise_review_workflows", id);
        const stagesResult = await db.findMany("enterprise_review_workflow_stages", {
          filters: { workflowId: id },
          pagination: { page: 1, pageSize: 50 },
        });
        const sorted = (stagesResult.data as { order?: number }[]).sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0),
        );
        res.json({ data: { ...workflow, stages: sorted } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    "/review-workflows/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = paramId(req.params.id);
        const stagesResult = await db.findMany("enterprise_review_workflow_stages", {
          filters: { workflowId: id },
          pagination: { page: 1, pageSize: 100 },
        });
        for (const row of stagesResult.data as { id: number }[]) {
          await db.delete("enterprise_review_workflow_stages", row.id);
        }
        await db.delete("enterprise_review_workflows", id);
        res.json({ data: { id } });
      } catch (err) {
        next(err);
      }
    },
  );

  // ---- Internationalization (i18n) ----

  router.get("/i18n/locales", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await db.findMany("enterprise_locales", {
        pagination: { page: 1, pageSize: 100 },
      });
      res.json({ data: result.data, meta: result.meta });
    } catch (err) {
      next(err);
    }
  });

  router.post("/i18n/locales", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, code, isDefault } = req.body;
      if (isDefault) {
        const existing = await db.findMany("enterprise_locales", { pagination: { page: 1, pageSize: 100 } });
        for (const row of existing.data as { id: number }[]) {
          await db.update("enterprise_locales", row.id, { isDefault: false });
        }
      }
      const locale = await db.create("enterprise_locales", {
        name: name || code,
        code: code || "en",
        isDefault: isDefault ?? false,
      });
      res.status(201).json({ data: locale });
    } catch (err) {
      next(err);
    }
  });

  router.put("/i18n/locales/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = paramId(req.params.id);
      const { name, code, isDefault } = req.body;
      if (isDefault) {
        const existing = await db.findMany("enterprise_locales", { pagination: { page: 1, pageSize: 100 } });
        for (const row of existing.data as { id: number }[]) {
          await db.update("enterprise_locales", row.id, { isDefault: false });
        }
      }
      const payload: Record<string, unknown> = {};
      if (name !== undefined) payload.name = name;
      if (code !== undefined) payload.code = code;
      if (isDefault !== undefined) payload.isDefault = isDefault;
      if (Object.keys(payload).length > 0) {
        await db.update("enterprise_locales", id, payload);
      }
      const updated = await db.findOne("enterprise_locales", id);
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  });

  router.delete("/i18n/locales/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = paramId(req.params.id);
      await db.delete("enterprise_locales", id);
      res.json({ data: { id } });
    } catch (err) {
      next(err);
    }
  });

  // ---- Email (store config + test) ----

  const EMAIL_STORE_KEY = "admin::email";

  router.get("/email/config", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const row = await db.findOneBy(STORE_TABLE, { key: EMAIL_STORE_KEY });
      if (!row) {
        return res.json({ data: { provider: "sendmail", from: "", testAddress: "" } });
      }
      const value = (row as { value?: string }).value;
      let parsed: unknown = {};
      try {
        if (typeof value === "string" && (value.startsWith("{") || value.startsWith("["))) parsed = JSON.parse(value);
      } catch {}
      res.json({ data: parsed });
    } catch (err) {
      next(err);
    }
  });

  router.post("/email/config", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const valueStr = JSON.stringify(req.body || {});
      const row = await db.findOneBy(STORE_TABLE, { key: EMAIL_STORE_KEY });
      if (row) {
        await db.update(STORE_TABLE, (row as { id: number }).id, { value: valueStr });
      } else {
        await db.create(STORE_TABLE, { key: EMAIL_STORE_KEY, value: valueStr, type: null, environment: null });
      }
      res.json({ data: { key: EMAIL_STORE_KEY } });
    } catch (err) {
      next(err);
    }
  });

  router.post("/email/test", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { to } = req.body || {};
      if (!to) {
        return res.status(400).json({ error: { message: "to is required" } });
      }
      const nodemailer = await import("nodemailer");
      const row = await db.findOneBy(STORE_TABLE, { key: EMAIL_STORE_KEY });
      const config = (row && (row as { value?: string }).value)
        ? (() => {
            try {
              return JSON.parse((row as { value: string }).value);
            } catch {
              return {};
            }
          })()
        : {};
      const transporter = nodemailer.default.createTransport(config.provider === "smtp" && config.smtp
        ? config.smtp
        : { streamTransport: true, newline: "unix" });
      await transporter.sendMail({
        from: config.from || "noreply@enterprise.local",
        to,
        subject: "Enterprise CMS – test email",
        text: "This is a test email from Enterprise CMS.",
      });
      res.json({ data: { ok: true, message: "Test email sent" } });
    } catch (err) {
      next(err);
    }
  });

  // ---- Plugins (state in core_store, key: admin::plugins) ----

  const PLUGINS_STORE_KEY = "admin::plugins";

  router.get("/plugins", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const row = await db.findOneBy(STORE_TABLE, { key: PLUGINS_STORE_KEY });
      let state: Record<string, boolean> = {};
      if (row && (row as { value?: string }).value) {
        try { state = JSON.parse((row as { value: string }).value); } catch { state = {}; }
      }
      res.json({ data: state });
    } catch (err) {
      next(err);
    }
  });

  router.post("/plugins/toggle", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { plugin, enabled } = req.body || {};
      if (!plugin) return res.status(400).json({ error: { message: "plugin is required" } });
      const row = await db.findOneBy(STORE_TABLE, { key: PLUGINS_STORE_KEY });
      let state: Record<string, boolean> = {};
      if (row && (row as { value?: string }).value) {
        try { state = JSON.parse((row as { value: string }).value); } catch { state = {}; }
      }
      state[plugin] = !!enabled;
      const valueStr = JSON.stringify(state);
      if (row) {
        await db.update(STORE_TABLE, (row as { id: number }).id, { value: valueStr });
      } else {
        await db.create(STORE_TABLE, { key: PLUGINS_STORE_KEY, value: valueStr, type: null, environment: null });
      }
      res.json({ data: state });
    } catch (err) {
      next(err);
    }
  });

  // ---- Middlewares (state in core_store, key: admin::middlewares) ----

  const MIDDLEWARES_STORE_KEY = "admin::middlewares";

  router.get("/middlewares", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const row = await db.findOneBy(STORE_TABLE, { key: MIDDLEWARES_STORE_KEY });
      let state: Record<string, boolean> = {};
      if (row && (row as { value?: string }).value) {
        try { state = JSON.parse((row as { value: string }).value); } catch { state = {}; }
      }
      res.json({ data: state });
    } catch (err) {
      next(err);
    }
  });

  router.post("/middlewares/toggle", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { middleware, enabled } = req.body || {};
      if (!middleware) return res.status(400).json({ error: { message: "middleware is required" } });
      const row = await db.findOneBy(STORE_TABLE, { key: MIDDLEWARES_STORE_KEY });
      let state: Record<string, boolean> = {};
      if (row && (row as { value?: string }).value) {
        try { state = JSON.parse((row as { value: string }).value); } catch { state = {}; }
      }
      state[middleware] = !!enabled;
      const valueStr = JSON.stringify(state);
      if (row) {
        await db.update(STORE_TABLE, (row as { id: number }).id, { value: valueStr });
      } else {
        await db.create(STORE_TABLE, { key: MIDDLEWARES_STORE_KEY, value: valueStr, type: null, environment: null });
      }
      res.json({ data: state });
    } catch (err) {
      next(err);
    }
  });

  // ---- Email Templates (Settings > Users & Permissions > Email templates) ----

  router.get("/email-templates", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await db.findMany("enterprise_email_templates", {
        pagination: { page: 1, pageSize: 100 },
      });
      res.json({ data: result.data, meta: result.meta });
    } catch (err) {
      next(err);
    }
  });

  router.post("/email-templates", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, displayName, subject, body, bodyType, fromName, fromEmail, responseEmail } = req.body || {};
      if (!name || !subject || !body) {
        return res.status(400).json({ error: { message: "name, subject, body are required" } });
      }
      const existing = await db.findOneBy("enterprise_email_templates", { name });
      if (existing) {
        await db.update("enterprise_email_templates", (existing as { id: number }).id, {
          displayName: displayName || name,
          subject,
          body,
          bodyType: bodyType ?? null,
          fromName: fromName ?? null,
          fromEmail: fromEmail ?? null,
          responseEmail: responseEmail ?? null,
        });
        const updated = await db.findOne("enterprise_email_templates", (existing as { id: number }).id);
        return res.json({ data: updated });
      }
      const tpl = await db.create("enterprise_email_templates", {
        name,
        displayName: displayName || name,
        subject,
        body,
        bodyType: bodyType ?? null,
        fromName: fromName ?? null,
        fromEmail: fromEmail ?? null,
        responseEmail: responseEmail ?? null,
      });
      res.status(201).json({ data: tpl });
    } catch (err) {
      next(err);
    }
  });

  router.put("/email-templates/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = paramId(req.params.id);
      const payload: Record<string, unknown> = {};
      const { displayName, subject, body, bodyType, fromName, fromEmail, responseEmail } = req.body || {};
      if (displayName !== undefined) payload.displayName = displayName;
      if (subject !== undefined) payload.subject = subject;
      if (body !== undefined) payload.body = body;
      if (bodyType !== undefined) payload.bodyType = bodyType;
      if (fromName !== undefined) payload.fromName = fromName;
      if (fromEmail !== undefined) payload.fromEmail = fromEmail;
      if (responseEmail !== undefined) payload.responseEmail = responseEmail;
      if (Object.keys(payload).length > 0) {
        await db.update("enterprise_email_templates", id, payload);
      }
      const updated = await db.findOne("enterprise_email_templates", id);
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  });

  router.delete("/email-templates/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = paramId(req.params.id);
      await db.delete("enterprise_email_templates", id);
      res.json({ data: { id } });
    } catch (err) {
      next(err);
    }
  });

  // ---- Users & Permissions: Advanced settings (store-based) ----

  const USERS_PERMISSIONS_KEY = "admin::users-permissions::advanced";

  router.get("/users-permissions/advanced", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const row = await db.findOneBy(STORE_TABLE, { key: USERS_PERMISSIONS_KEY });
      let value: Record<string, unknown> = {
        allowRegister: true,
        defaultRole: "authenticated",
        emailConfirmation: false,
        resetPasswordPage: "",
        emailConfirmationRedirection: "",
        uniqueEmail: true,
      };
      if (row && (row as { value?: string }).value) {
        try { value = { ...value, ...JSON.parse((row as { value: string }).value) }; } catch {}
      }
      res.json({ data: value });
    } catch (err) {
      next(err);
    }
  });

  router.post("/users-permissions/advanced", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const valueStr = JSON.stringify(req.body || {});
      const row = await db.findOneBy(STORE_TABLE, { key: USERS_PERMISSIONS_KEY });
      if (row) {
        await db.update(STORE_TABLE, (row as { id: number }).id, { value: valueStr });
      } else {
        await db.create(STORE_TABLE, { key: USERS_PERMISSIONS_KEY, value: valueStr, type: null, environment: null });
      }
      res.json({ data: req.body });
    } catch (err) {
      next(err);
    }
  });

  // ---- Users: edit / delete ----

  router.put("/users/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = paramId(req.params.id);
      const { email, username, firstName, lastName, role, isActive } = req.body || {};
      const payload: Record<string, unknown> = {};
      if (email !== undefined) payload.email = email;
      if (username !== undefined) payload.username = username;
      if (firstName !== undefined) payload.firstName = firstName;
      if (lastName !== undefined) payload.lastName = lastName;
      if (role !== undefined) payload.role = role;
      if (isActive !== undefined) payload.isActive = !!isActive;
      if (Object.keys(payload).length > 0) {
        await db.update("enterprise_users", id, payload);
      }
      const user = await db.findOne("enterprise_users", id) as Record<string, unknown> | null;
      if (user) {
        const { password: _, ...safe } = user as Record<string, unknown> & { password?: string };
        return res.json({ data: safe });
      }
      res.json({ data: null });
    } catch (err) {
      next(err);
    }
  });

  router.delete("/users/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = paramId(req.params.id);
      await db.delete("enterprise_users", id);
      res.json({ data: { id } });
    } catch (err) {
      next(err);
    }
  });

  // ---- Content History / Versioning ----

  router.get("/content-history", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uid = req.query.uid as string | undefined;
      const documentId = req.query.documentId as string | undefined;
      const entryId = req.query.entryId ? Number(req.query.entryId) : undefined;
      const page = Math.max(1, Number(req.query.page) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 25));
      const filters: Record<string, unknown> = {};
      if (uid) filters.uid = uid;
      if (documentId) filters.documentId = documentId;
      if (entryId !== undefined) filters.entryId = entryId;
      const result = await db.findMany("enterprise_content_history", {
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        pagination: { page, pageSize },
        sort: [{ field: "created_at", direction: "desc" }],
      });
      res.json({ data: result.data, meta: result.meta });
    } catch (err) {
      next(err);
    }
  });

  router.post("/content-history/:id/restore", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = paramId(req.params.id);
      const version = await db.findOne("enterprise_content_history", id) as Record<string, unknown> | null;
      if (!version) {
        return res.status(404).json({ error: { message: "Version not found" } });
      }
      const uid = version.uid as string;
      const schema = schemaRegistry.get(uid);
      if (!schema) {
        return res.status(404).json({ error: { message: "Content type not found" } });
      }
      const data = typeof version.data === "string" ? JSON.parse(version.data as string) : version.data;
      const entryId = version.entryId as number | null;
      const { id: _id, documentId: _did, ...rest } = (data || {}) as Record<string, unknown>;
      let restored: unknown;
      if (entryId) {
        await db.update(schema.collectionName, entryId, rest);
        restored = await db.findOne(schema.collectionName, entryId);
      } else {
        restored = await db.create(schema.collectionName, rest);
      }
      res.json({ data: restored });
    } catch (err) {
      next(err);
    }
  });

  router.delete("/content-history/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = paramId(req.params.id);
      await db.delete("enterprise_content_history", id);
      res.json({ data: { id } });
    } catch (err) {
      next(err);
    }
  });

  // ---- RBAC Permissions ----

  router.get("/roles/:id/permissions", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = paramId(req.params.id);
      const result = await db.findMany("enterprise_permissions", {
        filters: { roleId },
        pagination: { page: 1, pageSize: 500 },
      });
      res.json({ data: result.data, meta: result.meta });
    } catch (err) {
      next(err);
    }
  });

  router.put("/roles/:id/permissions", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = paramId(req.params.id);
      const permissions = Array.isArray(req.body) ? req.body : (req.body?.permissions ? req.body.permissions : []);
      const existing = await db.findMany("enterprise_permissions", {
        filters: { roleId },
        pagination: { page: 1, pageSize: 500 },
      });
      for (const row of existing.data as { id: number }[]) {
        await db.delete("enterprise_permissions", row.id);
      }
      const created = [];
      for (const p of permissions) {
        const { action, subject, properties, conditions } = p;
        if (action) {
          const row = await db.create("enterprise_permissions", {
            roleId,
            action: action || "",
            subject: subject ?? null,
            properties: properties ? JSON.stringify(properties) : null,
            conditions: conditions ? JSON.stringify(conditions) : null,
          });
          created.push(row);
        }
      }
      // Hot-apply: rebuild in-memory rules so the new matrix takes effect
      // without a server restart. Best-effort — failure here doesn't block
      // the response.
      try {
        await reloadPermissions?.();
      } catch (err) {
        console.warn("[admin] reloadPermissions failed:", err);
      }
      res.json({ data: created });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

function mapFieldTypeToColumnType(
  fieldType: string,
):
  | "string"
  | "text"
  | "integer"
  | "bigint"
  | "float"
  | "decimal"
  | "boolean"
  | "date"
  | "datetime"
  | "json"
  | "uuid" {
  const map: Record<
    string,
    | "string"
    | "text"
    | "integer"
    | "bigint"
    | "float"
    | "decimal"
    | "boolean"
    | "date"
    | "datetime"
    | "json"
    | "uuid"
  > = {
    string: "string",
    text: "text",
    richtext: "text",
    integer: "integer",
    biginteger: "bigint",
    float: "float",
    decimal: "decimal",
    boolean: "boolean",
    email: "string",
    password: "string",
    date: "date",
    datetime: "datetime",
    time: "string",
    json: "json",
    uid: "uuid",
    enumeration: "string",
    media: "json",
    relation: "integer",
    component: "json",
    dynamiczone: "json",
  };
  return map[fieldType] || "string";
}
