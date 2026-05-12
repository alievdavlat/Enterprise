import "dotenv/config";
import path from "path";
import fs from "fs";
import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { expressMiddleware } from "@as-integrations/express4";
import { json } from "express";
import { ApolloServer } from "@apollo/server";

import {
  SchemaRegistry,
  PluginRegistry,
  LifecycleManager,
  DocumentService,
  PermissionManager,
  ServiceRegistry,
  CronManager,
  buildOpenApiSpec,
  createEmailPlugin,
  createI18nPlugin,
  createUploadPlugin,
  createUsersPermissionsPlugin,
  createSeoPlugin,
} from "@enterprise/core";
import { createDatabaseAdapter, type DatabaseAdapter } from "@enterprise/database";
import type { EnterpriseConfig } from "@enterprise/types";

import { loadSchemasFromPath } from "./loadSchemasFromPath";
import { loadSchemasFromDb, ensureTableForSchema, persistRegistryToDb } from "./loadSchemasFromDb";
import { loadPluginsFromPath } from "./loaders/loadPluginsFromPath";
import { loadMiddlewaresFromPath } from "./loaders/loadMiddlewaresFromPath";
import { loadCronFromPath } from "./loaders/loadCronFromPath";
import { loadServicesFromPath } from "./loaders/loadServicesFromPath";
import { loadLifecyclesFromPath } from "./loaders/loadLifecyclesFromPath";
import { createAuthRouter } from "./routes/auth";
import { createContentTypeRouter } from "./routes/content-types";
import { createMediaRouter } from "./routes/media";
import { createWebhookRouter } from "./routes/webhooks";
import { createAdminRouter } from "./routes/admin";
import { createGraphQLServer } from "./graphql/server";
import { authMiddleware, adminAuthMiddleware, createContentApiAuth } from "./middlewares/auth";
import { errorHandler } from "./middlewares/errorHandler";

export class EnterpriseServer {
  private app: Application;
  private schemaRegistry: SchemaRegistry;
  private pluginRegistry: PluginRegistry;
  private lifecycleManager: LifecycleManager;
  private permissionManager: PermissionManager;
  private serviceRegistry: ServiceRegistry;
  private cronManager: CronManager;
  private documentService!: DocumentService;
  private db!: DatabaseAdapter;
  private config: EnterpriseConfig;
  private graphqlServer!: ApolloServer;
  private userMiddlewareHandlers: { name: string; handler: import("express").RequestHandler }[] = [];
  private discoveredPlugins: { registered: string[]; disabled: string[] } = { registered: [], disabled: [] };
  private discoveredMiddlewares: { resolved: string[]; unresolved: string[]; discovered: string[] } = {
    resolved: [],
    unresolved: [],
    discovered: [],
  };
  private discoveredCronJobs: { registered: string[]; skipped: string[] } = { registered: [], skipped: [] };
  private discoveredServices: { registered: string[]; skipped: string[] } = { registered: [], skipped: [] };

  constructor(config: EnterpriseConfig) {
    this.config = config;
    this.app = express();
    this.schemaRegistry = new SchemaRegistry();
    this.lifecycleManager = new LifecycleManager();
    this.permissionManager = new PermissionManager();
    this.serviceRegistry = new ServiceRegistry();
    this.cronManager = new CronManager();
    this.pluginRegistry = new PluginRegistry(this as any);
  }

  /** Strapi-style accessor: app.service('api::article.article') */
  service(uid: string) {
    return this.serviceRegistry.get(uid);
  }

  /** Strapi-style accessor: app.plugin('upload') */
  plugin(name: string) {
    return this.pluginRegistry.get(name);
  }

  /** Programmatic cron access for plugins / boot scripts. */
  get cron(): CronManager {
    return this.cronManager;
  }

  async initialize(): Promise<void> {
    // Connect to database (with timeout like Strapi: avoid hanging on wrong credentials)
    const dbConfig = this.config.database;
    const connectTimeoutMs = parseInt(process.env.DB_CONNECT_TIMEOUT || "10000", 10);
    this.db = await createDatabaseAdapter(dbConfig);
    await Promise.race([
      this.db.connect(),
      new Promise<void>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `Database connection timeout (${connectTimeoutMs}ms). Check DB_* in .env. For quickstart use DB_CLIENT=sqlite and DB_FILENAME=./.tmp/data.db`,
              ),
            ),
          connectTimeoutMs,
        ),
      ),
    ]);

    // Ensure enterprise_users table exists for auth + admin users list
    if (!(await this.db.tableExists("enterprise_users"))) {
      await this.db.createTable("enterprise_users", {
        columns: [
          { name: "email", type: "string", nullable: false, unique: true },
          { name: "username", type: "string", nullable: false },
          { name: "password", type: "string", nullable: true },
          { name: "firstName", type: "string", nullable: true },
          { name: "lastName", type: "string", nullable: true },
          { name: "role", type: "string", nullable: false },
          { name: "isActive", type: "boolean", nullable: false },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_users created");
    }

    // Ensure enterprise_api_tokens table for Settings > API Tokens
    if (!(await this.db.tableExists("enterprise_api_tokens"))) {
      await this.db.createTable("enterprise_api_tokens", {
        columns: [
          { name: "name", type: "string", nullable: false },
          { name: "description", type: "text", nullable: true },
          { name: "accessKey", type: "string", nullable: false, unique: true },
          { name: "type", type: "string", nullable: false },
          { name: "lifespan", type: "string", nullable: true },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_api_tokens created");
    }

    // Ensure enterprise_roles table for Settings > Roles
    if (!(await this.db.tableExists("enterprise_roles"))) {
      await this.db.createTable("enterprise_roles", {
        columns: [
          { name: "name", type: "string", nullable: false },
          { name: "description", type: "text", nullable: true },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_roles created");
    }

    // Strapi-style: persist content type schemas in DB (Content Type Builder)
    if (!(await this.db.tableExists("enterprise_content_type_schemas"))) {
      await this.db.createTable("enterprise_content_type_schemas", {
        columns: [
          { name: "uid", type: "string", nullable: false, unique: true },
          { name: "schema", type: "text", nullable: false },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_content_type_schemas created");
    }

    // Strapi-style: key-value store for settings (overview, customization, i18n, etc.)
    if (!(await this.db.tableExists("enterprise_core_store_settings"))) {
      await this.db.createTable("enterprise_core_store_settings", {
        columns: [
          { name: "key", type: "string", nullable: false, unique: true },
          { name: "value", type: "text", nullable: true },
          { name: "type", type: "string", nullable: true },
          { name: "environment", type: "string", nullable: true },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_core_store_settings created");
    }

    // Webhooks (Settings > Webhooks) – route uses this table
    if (!(await this.db.tableExists("enterprise_webhooks"))) {
      await this.db.createTable("enterprise_webhooks", {
        columns: [
          { name: "name", type: "string", nullable: false },
          { name: "url", type: "string", nullable: false },
          { name: "headers", type: "text", nullable: true },
          { name: "events", type: "text", nullable: true },
          { name: "enabled", type: "boolean", nullable: false },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_webhooks created");
    }

    // Transfer Tokens (Settings > Transfer Tokens)
    if (!(await this.db.tableExists("enterprise_transfer_tokens"))) {
      await this.db.createTable("enterprise_transfer_tokens", {
        columns: [
          { name: "name", type: "string", nullable: false },
          { name: "description", type: "text", nullable: true },
          { name: "accessKey", type: "string", nullable: false, unique: true },
          { name: "permissions", type: "text", nullable: true },
          { name: "lifespan", type: "string", nullable: true },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_transfer_tokens created");
    }

    // Audit Logs (Settings > Audit Logs)
    if (!(await this.db.tableExists("enterprise_audit_logs"))) {
      await this.db.createTable("enterprise_audit_logs", {
        columns: [
          { name: "action", type: "string", nullable: false },
          { name: "userId", type: "integer", nullable: true },
          { name: "email", type: "string", nullable: true },
          { name: "ip", type: "string", nullable: true },
          { name: "userAgent", type: "text", nullable: true },
          { name: "payload", type: "text", nullable: true },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_audit_logs created");
    }

    // Review Workflows (Settings > Review Workflows)
    if (!(await this.db.tableExists("enterprise_review_workflows"))) {
      await this.db.createTable("enterprise_review_workflows", {
        columns: [
          { name: "name", type: "string", nullable: false },
          { name: "description", type: "text", nullable: true },
          { name: "contentTypes", type: "text", nullable: true },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_review_workflows created");
    }
    if (!(await this.db.tableExists("enterprise_review_workflow_stages"))) {
      await this.db.createTable("enterprise_review_workflow_stages", {
        columns: [
          { name: "workflowId", type: "integer", nullable: false },
          { name: "name", type: "string", nullable: false },
          { name: "order", type: "integer", nullable: false },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_review_workflow_stages created");
    }

    // Internationalization (i18n) – locales
    if (!(await this.db.tableExists("enterprise_locales"))) {
      await this.db.createTable("enterprise_locales", {
        columns: [
          { name: "name", type: "string", nullable: false },
          { name: "code", type: "string", nullable: false, unique: true },
          { name: "isDefault", type: "boolean", nullable: false },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_locales created");
    }

    // RBAC: permissions per role (action + subject)
    if (!(await this.db.tableExists("enterprise_permissions"))) {
      await this.db.createTable("enterprise_permissions", {
        columns: [
          { name: "roleId", type: "integer", nullable: false },
          { name: "action", type: "string", nullable: false },
          { name: "subject", type: "string", nullable: true },
          { name: "properties", type: "text", nullable: true },
          { name: "conditions", type: "text", nullable: true },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_permissions created");
    }

    // Media Library (Strapi-style: DB metadata + file on disk)
    if (!(await this.db.tableExists("enterprise_media"))) {
      await this.db.createTable("enterprise_media", {
        columns: [
          { name: "name", type: "string", nullable: false },
          { name: "hash", type: "string", nullable: false },
          { name: "ext", type: "string", nullable: true },
          { name: "mime", type: "string", nullable: false },
          { name: "size", type: "float", nullable: true },
          { name: "url", type: "string", nullable: false },
          { name: "provider", type: "string", nullable: true },
          { name: "caption", type: "text", nullable: true },
          { name: "alternativeText", type: "text", nullable: true },
          { name: "folderPath", type: "string", nullable: true },
          { name: "width", type: "integer", nullable: true },
          { name: "height", type: "integer", nullable: true },
          { name: "formats", type: "text", nullable: true },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_media created");
    } else if (typeof (this.db as { addColumnIfNotExists?: unknown }).addColumnIfNotExists === "function") {
      // Migration for existing installs: ensure responsive-image columns exist.
      const addCol = (this.db as { addColumnIfNotExists: (t: string, c: string, type: string, opts?: { nullable?: boolean }) => Promise<void> }).addColumnIfNotExists;
      try {
        await addCol("enterprise_media", "width", "integer", { nullable: true });
        await addCol("enterprise_media", "height", "integer", { nullable: true });
        await addCol("enterprise_media", "formats", "text", { nullable: true });
      } catch (err) {
        console.warn("[Enterprise] Could not migrate enterprise_media:", err);
      }
    }

    // Media folders (for organizing assets)
    if (!(await this.db.tableExists("enterprise_media_folders"))) {
      await this.db.createTable("enterprise_media_folders", {
        columns: [
          { name: "name", type: "string", nullable: false },
          { name: "path", type: "string", nullable: false, unique: true },
          { name: "parentPath", type: "string", nullable: true },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_media_folders created");
    }

    // Email templates (Settings > Users & Permissions > Email templates)
    if (!(await this.db.tableExists("enterprise_email_templates"))) {
      await this.db.createTable("enterprise_email_templates", {
        columns: [
          { name: "name", type: "string", nullable: false, unique: true },
          { name: "displayName", type: "string", nullable: false },
          { name: "subject", type: "string", nullable: false },
          { name: "body", type: "text", nullable: false },
          { name: "bodyType", type: "string", nullable: true },
          { name: "fromName", type: "string", nullable: true },
          { name: "fromEmail", type: "string", nullable: true },
          { name: "responseEmail", type: "string", nullable: true },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_email_templates created");
    } else {
      // Migration: add bodyType column on existing installs
      try {
        const cols = await this.db.findMany("enterprise_email_templates", {
          pagination: { page: 1, pageSize: 1 },
        });
        const sample = cols.data?.[0] as Record<string, unknown> | undefined;
        if (sample && !("bodyType" in sample)) {
          if (typeof (this.db as any).addColumn === "function") {
            await (this.db as any).addColumn("enterprise_email_templates", {
              name: "bodyType",
              type: "string",
              nullable: true,
            });
            console.log("[Enterprise] Added bodyType column to enterprise_email_templates");
          }
        }
      } catch {
        /* best-effort migration */
      }
    }

    // Content history / versioning (Strapi v5 Enterprise: revision per update/publish)
    if (!(await this.db.tableExists("enterprise_content_history"))) {
      await this.db.createTable("enterprise_content_history", {
        columns: [
          { name: "uid", type: "string", nullable: false },
          { name: "documentId", type: "string", nullable: true },
          { name: "entryId", type: "integer", nullable: true },
          { name: "data", type: "text", nullable: false },
          { name: "status", type: "string", nullable: true },
          { name: "userId", type: "integer", nullable: true },
          { name: "userEmail", type: "string", nullable: true },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_content_history created");
    }

    this.documentService = new DocumentService(
      this.schemaRegistry,
      this.db,
      this.lifecycleManager,
    );

    // 1) Load schemas from DB first (Strapi-style: admin-created content types persist)
    const fromDb = await loadSchemasFromDb(this.db, this.schemaRegistry);
    if (fromDb > 0) {
      console.log(`[Enterprise] Loaded ${fromDb} content-type(s) from database`);
    }

    // 2) Load from files (schema/ and src/api) so deploy-with-repo brings schema
    const projectRoot = this.config.appPath ?? path.resolve(process.cwd(), "..");
    const loadedFromFiles = await loadSchemasFromPath(projectRoot, this.schemaRegistry);
    if (loadedFromFiles > 0) {
      console.log(`[Enterprise] Loaded ${loadedFromFiles} content-type(s) from project files`);
      // First boot: persist file-based schemas to DB so next start has them in DB
      if (fromDb === 0) {
        const persisted = await persistRegistryToDb(this.db, this.schemaRegistry);
        if (persisted > 0) console.log(`[Enterprise] Persisted ${persisted} schema(s) to database (first-boot seed)`);
      }
    }

    // 3) Ensure data table exists for every registered schema (auto-create if missing)
    for (const schema of this.schemaRegistry.getAll()) {
      try {
        await ensureTableForSchema(this.db, schema);
      } catch (err) {
        console.warn(`[Enterprise] Could not ensure table ${schema.collectionName}:`, err);
      }
    }

    // 4) Default permission rules (Strapi-style). Admin/superAdmin bypass via
    //    PermissionManager.defaultAllowAdmin. Public role can read; authenticated
    //    role can also write/publish. Admin UI Settings > Roles can override
    //    these via enterprise_permissions (synced back in via syncPermissionsFromDb).
    const WRITE_ACTIONS = ["create", "update", "delete", "publish", "unpublish"];
    const READ_ACTIONS = ["find", "findOne", "count"];
    for (const schema of this.schemaRegistry.getAll()) {
      const uid = schema.uid;
      for (const action of [...READ_ACTIONS, ...WRITE_ACTIONS]) {
        this.permissionManager.addRule({ action: `${uid}.${action}`, role: "authenticated", allow: true });
        this.permissionManager.addRule({
          action: `${uid}.${action}`,
          role: "public",
          allow: READ_ACTIONS.includes(action),
        });
      }
    }
    this.permissionManager.addRule({ action: "plugin::upload.read", role: "authenticated", allow: true });
    this.permissionManager.addRule({ action: "plugin::upload.assets.create", role: "authenticated", allow: true });

    // Layer admin-defined overrides from enterprise_permissions on top.
    await this.syncPermissionsFromDb();

    // 5) Ensure the first user is superAdmin (Strapi-like bootstrap)
    try {
      const firstUserResult = await this.db.findMany("enterprise_users", {
        pagination: { page: 1, pageSize: 1 },
        sort: [{ field: "id", direction: "asc" }],
      });
      const firstUser = firstUserResult.data[0] as { id: number; role?: string } | undefined;
      if (firstUser && firstUser.role !== "superAdmin" && firstUser.role !== "admin") {
        await this.db.update("enterprise_users", firstUser.id, { role: "superAdmin" });
        console.log(`[Enterprise] Promoted user #${firstUser.id} to superAdmin`);
      }
    } catch {
      // Table may not exist yet on fresh install
    }

    // 6) Strapi-style filesystem extensibility
    const userProjectRoot = this.config.appPath ?? path.resolve(process.cwd(), "..");
    try {
      const lifecycles = await loadLifecyclesFromPath(userProjectRoot, this.lifecycleManager, this.schemaRegistry);
      if (lifecycles.registered.length > 0) {
        console.log(
          `[Enterprise] Loaded lifecycles for ${lifecycles.registered.length} content type(s): ` +
            lifecycles.registered.map((r) => r.uid).join(", "),
        );
      }
    } catch (err) {
      console.warn("[Enterprise] Lifecycles loader failed:", err);
    }
    try {
      this.discoveredServices = await loadServicesFromPath(userProjectRoot, this.serviceRegistry, this);
      if (this.discoveredServices.registered.length > 0) {
        console.log(`[Enterprise] Loaded ${this.discoveredServices.registered.length} service(s): ${this.discoveredServices.registered.join(", ")}`);
      }
    } catch (err) {
      console.warn("[Enterprise] Services loader failed:", err);
    }
    // Built-in plugins. Each ships a real service accessible via
    // `app.plugin('<name>').services.*`. User plugins (loadPluginsFromPath)
    // run after so they can override or extend these.
    try {
      const pluginToggles = await this.readPluginToggles();
      const builtIns: { name: string; factory: () => import("@enterprise/types").Plugin }[] = [
        { name: "email", factory: () => createEmailPlugin() },
        { name: "upload", factory: () => createUploadPlugin() },
        { name: "i18n", factory: () => createI18nPlugin() },
        { name: "users-permissions", factory: () => createUsersPermissionsPlugin() },
        { name: "seo", factory: () => createSeoPlugin() },
      ];
      for (const b of builtIns) {
        if (pluginToggles[b.name] === false) {
          console.log(`[Enterprise] Built-in plugin "${b.name}" disabled via admin::plugins toggle`);
          continue;
        }
        this.pluginRegistry.register(b.factory());
      }
    } catch (err) {
      console.warn("[Enterprise] Built-in plugin registration failed:", err);
    }
    try {
      this.discoveredPlugins = await loadPluginsFromPath(userProjectRoot, this.pluginRegistry, this);
      if (this.discoveredPlugins.registered.length > 0) {
        console.log(`[Enterprise] Loaded ${this.discoveredPlugins.registered.length} plugin(s): ${this.discoveredPlugins.registered.join(", ")}`);
      }
      if (this.discoveredPlugins.disabled.length > 0) {
        console.log(`[Enterprise] Disabled plugin(s) (config): ${this.discoveredPlugins.disabled.join(", ")}`);
      }
    } catch (err) {
      console.warn("[Enterprise] Plugins loader failed:", err);
    }
    try {
      await this.pluginRegistry.runRegister();
    } catch (err) {
      console.error("[Enterprise] Plugin register() phase failed:", err);
    }
    try {
      this.discoveredCronJobs = await loadCronFromPath(userProjectRoot, this.cronManager, this);
      if (this.discoveredCronJobs.registered.length > 0) {
        console.log(`[Enterprise] Loaded ${this.discoveredCronJobs.registered.length} cron job(s): ${this.discoveredCronJobs.registered.join(", ")}`);
      }
    } catch (err) {
      console.warn("[Enterprise] Cron loader failed:", err);
    }
    try {
      const middlewares = await loadMiddlewaresFromPath(userProjectRoot, this);
      this.userMiddlewareHandlers = middlewares.handlers;
      this.discoveredMiddlewares = {
        resolved: middlewares.resolved,
        unresolved: middlewares.unresolved,
        discovered: middlewares.discovered,
      };
      if (middlewares.resolved.length > 0) {
        console.log(`[Enterprise] Loaded ${middlewares.resolved.length} middleware(s) from config: ${middlewares.resolved.join(", ")}`);
      }
      if (middlewares.unresolved.length > 0) {
        console.warn(`[Enterprise] Unresolved middleware(s) in config (skipped): ${middlewares.unresolved.join(", ")}`);
      }
    } catch (err) {
      console.warn("[Enterprise] Middlewares loader failed:", err);
    }

    // Setup Express middleware
    this.setupMiddlewares();

    // Setup routes
    this.setupRoutes();

    // Setup GraphQL if enabled (non-fatal if it fails)
    if (this.config.api?.graphql?.enabled) {
      try {
        await this.setupGraphQL();
      } catch (err) {
        console.error("[Enterprise] Failed to setup GraphQL. Continuing without it.", err);
      }
    }

    // Error handler (must be last)
    this.app.use(errorHandler);

    console.log("[Enterprise] Server initialized successfully");
  }

  private setupMiddlewares(): void {
    // Security
    this.app.use(
      helmet({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: false,
      }),
    );

    // CORS
    const corsOrigin = this.config.server?.cors?.origin || "*";
    this.app.use(
      cors({
        origin: corsOrigin,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      }),
    );

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(json({ limit: "50mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "50mb" }));

    // Logging
    this.app.use(morgan("combined"));

    // User-defined middlewares (config/middlewares.ts + src/middlewares/*).
    // Applied here so they run after the security/CORS/body bootstrap and
    // before any API routers / health endpoints.
    for (const m of this.userMiddlewareHandlers) {
      try {
        this.app.use(m.handler);
      } catch (err) {
        console.warn(`[Enterprise:Middlewares] Failed to apply "${m.name}":`, err);
      }
    }

    // Health check
    this.app.get("/health", (req, res) => {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        database: this.db.isConnected() ? "connected" : "disconnected",
      });
    });

    // API info
    this.app.get("/", (req, res) => {
      res.json({
        name: "Enterprise CMS API",
        version: "1.0.0",
        documentation: "/api/docs",
        openapi: "/api/openapi.json",
        contentTypes: this.schemaRegistry.getAll().map((s) => ({
          uid: s.uid,
          kind: s.kind,
          displayName: s.displayName,
        })),
      });
    });

    // OpenAPI spec (Strapi-style)
    const apiPrefix = this.config.api?.rest?.prefix || "/api";
    this.app.get(`${apiPrefix}/openapi.json`, (_req, res) => {
      const spec = buildOpenApiSpec(this.schemaRegistry, {
        title: "Enterprise CMS API",
        version: "1.0.0",
        basePath: apiPrefix,
      });
      res.json(spec);
    });

    // Serve uploaded media (Strapi-style: /uploads/*)
    const uploadDir = path.resolve(process.env.UPLOAD_DIR || "public/uploads");
    if (fs.existsSync(uploadDir)) {
      this.app.use("/uploads", express.static(uploadDir));
    }

    // Serve admin panel at /admin (Strapi-style: same port as API)
    const cwd = this.config.appPath || process.cwd();
    const candidates: string[] = [
      path.resolve(cwd, "build"),
      path.resolve(cwd, "out"),
      path.resolve(cwd, "packages", "admin", "out"),
      path.resolve(cwd, "..", "packages", "admin", "out"),
      path.resolve(cwd, "..", "..", "packages", "admin", "out"),
      path.resolve(cwd, "..", "admin", "out"),
      path.resolve(cwd, "node_modules", "@enterprise", "admin", "out"),
    ];
    let adminBuildDir: string | null = null;
    for (const dir of candidates) {
      if (fs.existsSync(dir) && fs.existsSync(path.join(dir, "index.html"))) {
        adminBuildDir = dir;
        break;
      }
    }
    if (adminBuildDir) {
      this.app.use("/admin", express.static(adminBuildDir, { index: false }));
      this.app.get("/admin", (_req, res) => {
        res.sendFile(path.join(adminBuildDir!, "index.html"));
      });
      this.app.get("/admin/*", (_req, res) => {
        const sub = _req.path.replace(/^\/admin\/?/, "") || "index";
        const asFile = path.join(adminBuildDir!, sub);
        const asDirIndex = path.join(adminBuildDir!, sub, "index.html");
        if (fs.existsSync(asFile) && fs.statSync(asFile).isFile()) {
          res.sendFile(asFile);
        } else if (fs.existsSync(asDirIndex)) {
          res.sendFile(asDirIndex);
        } else {
          res.sendFile(path.join(adminBuildDir!, "index.html"));
        }
      });
      console.log("[Enterprise] Admin panel served at /admin from " + adminBuildDir);
    } else {
      const isDev = process.env.NODE_ENV !== "production";
      const adminDevUrl = process.env.ADMIN_DEV_URL || "http://localhost:3000";
      if (isDev) {
        console.log("[Enterprise] Admin build not found. Development mode: open " + adminDevUrl + " for Admin with hot reload.");
      }
      this.app.get("/admin", (_req, res) => {
        if (isDev) {
          res.status(200).type("text/html").send(`
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Admin – Development</title></head>
<body style="font-family:system-ui;max-width:520px;margin:3rem auto;padding:0 1rem;">
  <h1>Admin (development)</h1>
  <p>In development mode the Admin UI runs separately with <strong>hot reload</strong> (code changes apply immediately).</p>
  <p><a href="${adminDevUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:0.6rem 1.2rem;text-decoration:none;border-radius:6px;">Open Admin UI →</a></p>
  <p style="color:#64748b;font-size:0.9rem;">With <code>npm run develop</code> (or root <code>npm run dev</code>), Admin runs at <a href="${adminDevUrl}">${adminDevUrl}</a> with hot reload; API is on this server. Code changes in admin or server apply immediately.</p>
  <hr style="margin:2rem 0;border:0;border-top:1px solid #e2e8f0;">
  <p style="font-size:0.85rem;color:#64748b;">To serve a static build from this server (e.g. production), run <code>npm run build</code> then <code>npm start</code>.</p>
</body></html>
          `);
        } else {
          res.status(503).type("text/html").send(`
          <h1>Admin panel not built</h1>
          <p>Run from your app directory:</p>
          <pre>npm run build && npm start</pre>
          <p>This creates the <code>build/</code> folder with the admin UI.</p>
          <p>From monorepo root: <code>npm run build -w @enterprise/admin</code> (exports to <code>packages/admin/out</code>).</p>
        `);
        }
      });
    }
  }

  private setupRoutes(): void {
    const apiPrefix = this.config.api?.rest?.prefix || "/api";

    // Auth routes
    this.app.use(`${apiPrefix}/auth`, createAuthRouter(this.db));

    // Public UI configuration (read-only, used by /login & /register before authentication)
    // Whitelist of safe-to-read store keys.
    const PUBLIC_UI_KEYS = new Set<string>(["admin::ui::auth-template"]);
    this.app.get(`${apiPrefix}/public/ui-config`, async (req, res, next) => {
      try {
        const key = req.query.key as string;
        if (!key || !PUBLIC_UI_KEYS.has(key)) {
          return res.status(404).json({ error: { message: "Not found" } });
        }
        const row = await this.db.findOneBy("enterprise_core_store_settings", {
          key,
        });
        if (!row) {
          return res.status(404).json({ error: { message: "Not found" } });
        }
        const value = (row as { value?: string }).value;
        let parsed: unknown = value;
        try {
          if (
            typeof value === "string" &&
            (value.startsWith("{") || value.startsWith("["))
          ) {
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

    // Content type routes (auto-generated from schemas, Strapi v5 Document Service)
    // Public GET, authenticated POST/PUT/DELETE – like Strapi's default Public role
    const contentApiAuth = createContentApiAuth(this.db);
    const contentTypeRouter = createContentTypeRouter(
      this.schemaRegistry,
      this.db,
      this.lifecycleManager,
      this.documentService,
      this.permissionManager,
    );
    this.app.use(apiPrefix, contentApiAuth, contentTypeRouter);

    // Admin routes (protected with admin role check – Strapi-like)
    const registerSchema = (contentTypeRouter as any).__registerSchema as
      | ((schema: any) => void)
      | undefined;
    const projectRoot = this.config.appPath ?? process.cwd();
    try {
      const schemaDir = path.join(projectRoot, "schema");
      if (!fs.existsSync(schemaDir)) fs.mkdirSync(schemaDir, { recursive: true });
      console.log(`[Enterprise] Schema files (schema-as-code) will be written to: ${path.resolve(projectRoot, "schema")}`);
    } catch {}
    this.app.use(
      `${apiPrefix}/admin`,
      adminAuthMiddleware,
      createAdminRouter(this.schemaRegistry, this.db, {
        onSchemaRegistered: (schema) => registerSchema?.(schema),
        getProjectRoot: () => projectRoot,
        getDiscoveredArtifacts: () => this.getDiscoveredArtifacts(),
        reloadPermissions: () => this.syncPermissionsFromDb(),
      }),
    );

    // Media library (admin auth)
    this.app.use(`${apiPrefix}/upload`, authMiddleware, createMediaRouter(this.db));

    // Webhooks (admin auth)
    this.app.use(
      `${apiPrefix}/webhooks`,
      authMiddleware,
      createWebhookRouter(this.db),
    );
  }

  private async setupGraphQL(): Promise<void> {
    const { server, schema } = await createGraphQLServer(
      this.schemaRegistry,
      this.db,
    );
    this.graphqlServer = server;
    await this.graphqlServer.start();

    const endpoint = this.config.api?.graphql?.endpoint || "/graphql";
    const graphqlHandler = expressMiddleware(this.graphqlServer, {
      context: async ({ req }) => ({
        token: req.headers.authorization,
        db: this.db,
        schemaRegistry: this.schemaRegistry,
      }),
    });
    this.app.use(endpoint, cors<cors.CorsRequest>(), json(), graphqlHandler as any);
    console.log(`[Enterprise] GraphQL endpoint: ${endpoint}`);
  }

  get getSchemaRegistry(): SchemaRegistry {
    return this.schemaRegistry;
  }

  get getLifecycleManager(): LifecycleManager {
    return this.lifecycleManager;
  }

  /** @deprecated Use getLifecycleManager. */
  get getHookManager(): LifecycleManager {
    return this.lifecycleManager;
  }

  get getPermissionManager(): PermissionManager {
    return this.permissionManager;
  }

  get getDb(): DatabaseAdapter {
    return this.db;
  }

  async start(): Promise<void> {
    // Plugin bootstrap() runs after middlewares + routes are wired so plugins
    // can extend the server (e.g. add routes via app or interact with DB).
    try {
      await this.pluginRegistry.runBootstrap();
    } catch (err) {
      console.error("[Enterprise] Plugin bootstrap() phase failed:", err);
    }
    // Start scheduled jobs once the server is about to come online.
    try {
      await this.cronManager.start();
    } catch (err) {
      console.warn("[Enterprise] Cron start failed:", err);
    }

    const port = this.config.port || 9390;
    const host = this.config.server?.host || "0.0.0.0";
    const displayHost = host === "0.0.0.0" ? "localhost" : host;

    await new Promise<void>((resolve, reject) => {
      const server = this.app.listen(port, host, () => {
        console.log(`
╔══════════════════════════════════════════════╗
║          Enterprise CMS Server               ║
╠══════════════════════════════════════════════╣
║  Status:   Running                           ║
║  URL:      http://${displayHost}:${port}${" ".repeat(Math.max(0, 24 - displayHost.length - String(port).length))}║
║  API:      http://${displayHost}:${port}/api${" ".repeat(Math.max(0, 21 - displayHost.length - String(port).length))}║
║  Admin:    http://${displayHost}:${port}/admin${" ".repeat(Math.max(0, 20 - displayHost.length - String(port).length))}║
╚══════════════════════════════════════════════╝
        `);
        resolve();
      });
      server.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
          console.error(
            `[Enterprise] Port ${port} is already in use. Stop the other process (e.g. previous develop) or set PORT=9391 in .env and restart.`,
          );
        }
        reject(err);
      });
    });
  }

  async stop(): Promise<void> {
    try {
      this.cronManager.stop();
    } catch {}
    try {
      await this.pluginRegistry.runDestroy();
    } catch (err) {
      console.warn("[Enterprise] Plugin destroy() phase failed:", err);
    }
    await this.db.disconnect();
    console.log("[Enterprise] Server stopped");
  }

  /**
   * Re-load admin-defined permissions from `enterprise_permissions` into the
   * in-memory PermissionManager. Called at boot and exposed via
   * `app.reloadPermissions()` so the admin Roles editor can apply changes
   * without a server restart.
   *
   * Rows look like `{ roleId, action, subject?, properties?, conditions? }`.
   * For each row we resolve `roleId` to a role name (lower-cased) and add an
   * allow rule. Rows with `subject` produce `${subject}.${action}`; rows
   * without one produce just `${action}`. Existing default rules stay in
   * place — admin overrides layer on top.
   */
  async syncPermissionsFromDb(): Promise<void> {
    try {
      const hasPerm = await this.db.tableExists("enterprise_permissions");
      const hasRoles = await this.db.tableExists("enterprise_roles");
      if (!hasPerm || !hasRoles) return;
      const roles = (await this.db.findMany("enterprise_roles", {
        pagination: { page: 1, pageSize: 500 },
      })).data as { id: number; name: string }[];
      const roleNameById = new Map(roles.map((r) => [r.id, r.name?.toLowerCase()]));
      const permissions = (await this.db.findMany("enterprise_permissions", {
        pagination: { page: 1, pageSize: 5000 },
      })).data as { roleId: number; action: string; subject?: string | null }[];
      for (const p of permissions) {
        const roleName = roleNameById.get(p.roleId);
        if (!roleName) continue;
        const action = p.subject ? `${p.subject}.${p.action}` : p.action;
        this.permissionManager.addRule({ action, role: roleName, allow: true });
      }
      if (permissions.length > 0) {
        console.log(`[Enterprise] Synced ${permissions.length} permission rule(s) from DB`);
      }
    } catch (err) {
      console.warn("[Enterprise] syncPermissionsFromDb failed:", err);
    }
  }

  /**
   * Read the admin::plugins toggle map from core_store. Used to opt-out of a
   * built-in plugin from the admin UI without redeploying.
   */
  private async readPluginToggles(): Promise<Record<string, boolean>> {
    try {
      if (!(await this.db.tableExists("enterprise_core_store_settings"))) return {};
      const row = await this.db.findOneBy("enterprise_core_store_settings", {
        key: "admin::plugins",
      });
      const value = (row as { value?: string } | null)?.value;
      if (typeof value !== "string" || !(value.startsWith("{") || value.startsWith("["))) {
        return {};
      }
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  }

  /** Diagnostics for admin UI: discovered plugins/middlewares/cron/services. */
  getDiscoveredArtifacts(): {
    plugins: { registered: string[]; disabled: string[] };
    middlewares: { resolved: string[]; unresolved: string[]; discovered: string[] };
    cron: { name: string; schedule: string; running: boolean }[];
    services: { registered: string[]; skipped: string[] };
  } {
    return {
      plugins: this.discoveredPlugins,
      middlewares: this.discoveredMiddlewares,
      cron: this.cronManager.list().map((j: import("@enterprise/core").CronJob) => ({
        name: j.name,
        schedule: j.schedule,
        running: this.cronManager.isRunning(j.name),
      })),
      services: this.discoveredServices,
    };
  }
}

export { SchemaRegistry, LifecycleManager, PermissionManager, PluginRegistry };
