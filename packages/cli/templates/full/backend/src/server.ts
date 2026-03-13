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

import { SchemaRegistry, PluginRegistry, HookManager, DocumentService } from "@enterprise/core";
import { createDatabaseAdapter, type DatabaseAdapter } from "@enterprise/database";
import type { EnterpriseConfig } from "@enterprise/types";

import { loadSchemasFromPath } from "./loadSchemasFromPath";
import { loadSchemasFromDb, ensureTableForSchema } from "./loadSchemasFromDb";
import { createAuthRouter } from "./routes/auth";
import { createContentTypeRouter } from "./routes/content-types";
import { createMediaRouter } from "./routes/media";
import { createWebhookRouter } from "./routes/webhooks";
import { createAdminRouter } from "./routes/admin";
import { createGraphQLServer } from "./graphql/server";
import { authMiddleware } from "./middlewares/auth";
import { errorHandler } from "./middlewares/errorHandler";

export class EnterpriseServer {
  private app: Application;
  private schemaRegistry: SchemaRegistry;
  private pluginRegistry: PluginRegistry;
  private hookManager: HookManager;
  private documentService!: DocumentService;
  private db!: DatabaseAdapter;
  private config: EnterpriseConfig;
  private graphqlServer!: ApolloServer;

  constructor(config: EnterpriseConfig) {
    this.config = config;
    this.app = express();
    this.schemaRegistry = new SchemaRegistry();
    this.hookManager = new HookManager();
    this.pluginRegistry = new PluginRegistry(this as any);
  }

  async initialize(): Promise<void> {
    // Connect to database
    this.db = await createDatabaseAdapter(this.config.database);
    await this.db.connect();

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
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_media created");
    }

    this.documentService = new DocumentService(
      this.schemaRegistry,
      this.db,
      this.hookManager,
    );

    // 1) Load schemas from DB first (Strapi-style: admin-created content types persist)
    const fromDb = await loadSchemasFromDb(this.db, this.schemaRegistry);
    if (fromDb > 0) {
      console.log(`[Enterprise] Loaded ${fromDb} content-type(s) from database`);
    }

    // 2) Load from files (bootstrap; DB schemas already registered)
    const projectRoot = this.config.appPath ?? path.resolve(process.cwd(), "..");
    const loadedFromFiles = await loadSchemasFromPath(projectRoot, this.schemaRegistry);
    if (loadedFromFiles > 0) {
      console.log(`[Enterprise] Loaded ${loadedFromFiles} content-type(s) from src/api`);
    }

    // 3) Ensure data table exists for every registered schema (auto-create if missing)
    for (const schema of this.schemaRegistry.getAll()) {
      try {
        await ensureTableForSchema(this.db, schema);
      } catch (err) {
        console.warn(`[Enterprise] Could not ensure table ${schema.collectionName}:`, err);
      }
    }

    // Setup Express middleware
    this.setupMiddlewares();

    // Setup routes
    this.setupRoutes();

    // Setup GraphQL if enabled
    if (this.config.api?.graphql?.enabled) {
      await this.setupGraphQL();
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

    // Rate limiting
    if (this.config.server?.rateLimit?.enabled !== false) {
      this.app.use(
        rateLimit({
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: this.config.server?.rateLimit?.max || 100,
          message: { error: { status: 429, message: "Too many requests" } },
          standardHeaders: true,
          legacyHeaders: false,
        }),
      );
    }

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(json({ limit: "50mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "50mb" }));

    // Logging
    this.app.use(morgan("combined"));

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
        contentTypes: this.schemaRegistry.getAll().map((s) => ({
          uid: s.uid,
          kind: s.kind,
          displayName: s.displayName,
        })),
      });
    });

    // Serve uploaded media (Strapi-style: /uploads/*)
    const uploadDir = path.resolve(process.env.UPLOAD_DIR || "public/uploads");
    if (fs.existsSync(uploadDir)) {
      this.app.use("/uploads", express.static(uploadDir));
    }
  }

  private setupRoutes(): void {
    const apiPrefix = this.config.api?.rest?.prefix || "/api";

    // Auth routes
    this.app.use(`${apiPrefix}/auth`, createAuthRouter(this.db));

    // Admin routes (protected)
    this.app.use(
      `${apiPrefix}/admin`,
      authMiddleware,
      createAdminRouter(this.schemaRegistry, this.db),
    );

    // Content type routes (auto-generated from schemas, Strapi v5 Document Service)
    this.app.use(
      apiPrefix,
      createContentTypeRouter(
        this.schemaRegistry,
        this.db,
        this.hookManager,
        this.documentService,
      ),
    );

    // Media library
    this.app.use(`${apiPrefix}/upload`, authMiddleware, createMediaRouter(this.db));

    // Webhooks
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

  get getHookManager(): HookManager {
    return this.hookManager;
  }

  get getDb(): DatabaseAdapter {
    return this.db;
  }

  async start(): Promise<void> {
    const port = this.config.port || 9390;
    const host = this.config.server?.host || "0.0.0.0";

    await new Promise<void>((resolve) => {
      this.app.listen(port, host, () => {
        console.log(`
╔══════════════════════════════════════════════╗
║          Enterprise CMS Server               ║
╠══════════════════════════════════════════════╣
║  Status:   Running                           ║
║  URL:      http://${host}:${port}${" ".repeat(Math.max(0, 24 - host.length - String(port).length))}║
║  API:      http://${host}:${port}/api${" ".repeat(Math.max(0, 21 - host.length - String(port).length))}║
║  Admin:    http://localhost:3000             ║
╚══════════════════════════════════════════════╝
        `);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    await this.db.disconnect();
    console.log("[Enterprise] Server stopped");
  }
}

export { SchemaRegistry, HookManager, PluginRegistry };
