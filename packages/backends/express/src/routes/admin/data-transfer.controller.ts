import { Request, Response, NextFunction } from "express";
import type { ContentTypeSchema } from "@enterprise/types";
import { ensureTableForSchema } from "../../loadSchemasFromDb";
import { syncSchemaToFile } from "../../schemaSync";
import { parseJsonValue } from "../../lib/jsonValue";
import { SCHEMAS_TABLE, STORE_TABLE, type AdminCtx } from "./shared";

/**
 * Export / Import (schema + content, for deploy / backup / restore) and the
 * scheduled-backup configuration endpoints (Settings → Data Backup). The cron
 * wiring itself lives in EnterpriseServer; these routes persist config and
 * delegate via the applyBackupSchedule / runBackupNow / listBackups callbacks.
 */
export function registerDataTransferRoutes(ctx: AdminCtx): void {
  const { router, db, schemaRegistry, options } = ctx;
  const getProjectRoot = options.getProjectRoot;

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
      const stored = parseJsonValue<Record<string, unknown>>((row as { value?: unknown } | null)?.value, {});
      const parsed: Record<string, unknown> = {
        enabled: false,
        frequency: "daily",
        includeContent: true,
        includeUploads: false,
        retention: 7,
        ...stored,
      };
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
}
