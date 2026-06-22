import { Request, Response, NextFunction } from "express";
import type { ContentTypeSchema } from "@enterprise/types";
import bcrypt from "bcryptjs";
import { ensureTableForSchema } from "../../loadSchemasFromDb";
import { syncSchemaToFile, deleteSchemaFile } from "../../schemaSync";
import { parseJsonValue } from "../../lib/jsonValue";
import { SCHEMAS_TABLE, STORE_TABLE, paramId, type AdminCtx } from "./shared";

/** Identity & access: ACL catalog, OAuth providers, users, roles, API tokens. */
export function registerIamRoutes(ctx: AdminCtx): void {
  const { router, db, schemaRegistry, options } = ctx;
  const getProjectRoot = options.getProjectRoot;
  const reloadPermissions = options.reloadPermissions;
  const reloadCoreMiddlewares = options.reloadCoreMiddlewares;
  const applyBackupSchedule = options.applyBackupSchedule;
  const runBackupNow = options.runBackupNow;
  const listBackups = options.listBackups;
  const permissionManager = options.permissionManager;
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
      const { listOAuthPresets } = await import("../oauth-providers");
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
      const { getOAuthPreset } = await import("../oauth-providers");
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
}
