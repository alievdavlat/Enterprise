import { Request, Response, NextFunction } from "express";
import { paramId, type AdminCtx } from "./shared";

/**
 * No-code backend builder routes (Phase 16.x): user-defined cron jobs,
 * middlewares, custom routes, the generic services/lifecycles/extensions/plugins
 * CRUD, and the migrations runner. Each write compile-tests the snippet and
 * hot-reloads the in-memory registry via the matching reload callback.
 */
export function registerBuilderRoutes(ctx: AdminCtx): void {
  const { router, db, options } = ctx;
  const reloadUserCronJobs = options.reloadUserCronJobs;
  const reloadUserMiddlewares = options.reloadUserMiddlewares;
  const reloadUserRoutes = options.reloadUserRoutes;
  const reloadUserServices = options.reloadUserServices;
  const reloadUserLifecycles = options.reloadUserLifecycles;
  const reloadUserExtensions = options.reloadUserExtensions;
  const reloadUserPlugins = options.reloadUserPlugins;
  const getProjectRoot = options.getProjectRoot;

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
}
