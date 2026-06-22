import { Request, Response, NextFunction } from "express";
import type { ContentTypeSchema } from "@enterprise/types";
import bcrypt from "bcryptjs";
import { ensureTableForSchema } from "../../loadSchemasFromDb";
import { syncSchemaToFile, deleteSchemaFile } from "../../schemaSync";
import { parseJsonValue } from "../../lib/jsonValue";
import { SCHEMAS_TABLE, STORE_TABLE, paramId, type AdminCtx } from "./shared";

/** User edit/delete, content history/versioning, RBAC permissions. */
export function registerContentAdminRoutes(ctx: AdminCtx): void {
  const { router, db, schemaRegistry, options } = ctx;
  const getProjectRoot = options.getProjectRoot;
  const reloadPermissions = options.reloadPermissions;
  const reloadCoreMiddlewares = options.reloadCoreMiddlewares;
  const applyBackupSchedule = options.applyBackupSchedule;
  const runBackupNow = options.runBackupNow;
  const listBackups = options.listBackups;
  const permissionManager = options.permissionManager;
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
}
