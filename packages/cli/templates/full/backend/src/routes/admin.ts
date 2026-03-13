import { Router, Request, Response, NextFunction } from "express";
import type { SchemaRegistry } from "@enterprise/core";
import type { DatabaseAdapter } from "@enterprise/database";
import type { ContentTypeSchema } from "@enterprise/types";
import bcrypt from "bcryptjs";
import { ensureTableForSchema } from "../loadSchemasFromDb";

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
): Router {
  const router = Router();

  // ---- Content Types Admin API (persisted in DB like Strapi) ----

  /**
   * GET /api/admin/content-types
   * List all content type schemas
   */
  router.get("/content-types", (req: Request, res: Response) => {
    const schemas = schemaRegistry.getAll();
    res.json({ data: schemas });
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
   * Remove from DB store and registry (data table left intact to avoid data loss)
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
