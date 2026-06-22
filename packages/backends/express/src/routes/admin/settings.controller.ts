import { Request, Response, NextFunction } from "express";
import type { ContentTypeSchema } from "@enterprise/types";
import bcrypt from "bcryptjs";
import { ensureTableForSchema } from "../../loadSchemasFromDb";
import { syncSchemaToFile, deleteSchemaFile } from "../../schemaSync";
import { parseJsonValue } from "../../lib/jsonValue";
import { SCHEMAS_TABLE, STORE_TABLE, paramId, type AdminCtx } from "./shared";

/** Settings stores: core store, transfer tokens, audit logs, review workflows, i18n, email, plugin/middleware toggles, email templates, users-permissions advanced. */
export function registerSettingsRoutes(ctx: AdminCtx): void {
  const { router, db, schemaRegistry, options } = ctx;
  const getProjectRoot = options.getProjectRoot;
  const reloadPermissions = options.reloadPermissions;
  const reloadCoreMiddlewares = options.reloadCoreMiddlewares;
  const applyBackupSchedule = options.applyBackupSchedule;
  const runBackupNow = options.runBackupNow;
  const listBackups = options.listBackups;
  const permissionManager = options.permissionManager;
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
      const config = parseJsonValue<Record<string, any>>(
        (row as { value?: unknown } | null)?.value,
        {},
      );
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
      state = parseJsonValue<Record<string, boolean>>((row as { value?: unknown } | null)?.value, state);
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
      state = parseJsonValue<Record<string, boolean>>((row as { value?: unknown } | null)?.value, state);
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
      state = parseJsonValue<Record<string, boolean>>((row as { value?: unknown } | null)?.value, state);
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
      state = parseJsonValue<Record<string, boolean>>((row as { value?: unknown } | null)?.value, state);
      state[middleware] = !!enabled;
      const valueStr = JSON.stringify(state);
      if (row) {
        await db.update(STORE_TABLE, (row as { id: number }).id, { value: valueStr });
      } else {
        await db.create(STORE_TABLE, { key: MIDDLEWARES_STORE_KEY, value: valueStr, type: null, environment: null });
      }
      // Apply the new on/off state to the live Express middleware gates (no restart).
      await reloadCoreMiddlewares?.();
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
      value = { ...value, ...parseJsonValue<Record<string, unknown>>((row as { value?: unknown } | null)?.value, {}) };
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
}
