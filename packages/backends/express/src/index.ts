import "dotenv/config";
import { EnterpriseServer } from "./server";
import type { EnterpriseConfig } from "@enterprise/types";

export { EnterpriseServer } from "./server";
export type { EnterpriseConfig } from "@enterprise/types";

const config: EnterpriseConfig = {
  appName: process.env.APP_NAME || "Enterprise CMS",
  url: process.env.APP_URL || "http://localhost:9390",
  port: parseInt(process.env.PORT || "9390", 10),
  admin: {
    auth: {
      secret:
        process.env.ADMIN_JWT_SECRET || "admin-jwt-secret-change-in-production",
    },
  },
  database: {
    client: (process.env.DB_CLIENT || "sqlite") as
      | "postgres"
      | "mysql"
      | "mongodb"
      | "sqlite",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    database: process.env.DB_NAME || "enterprise",
    filename: process.env.DB_FILENAME || "./.tmp/data.db",
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    uri: process.env.DB_URI,
    ssl: process.env.DB_SSL === "true",
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || "2", 10),
      max: parseInt(process.env.DB_POOL_MAX || "10", 10),
    },
  },
  server: {
    host: process.env.HOST || "0.0.0.0",
    port: parseInt(process.env.PORT || "9390", 10),
    cors: {
      enabled: true,
      origin: process.env.CORS_ORIGIN || "http://localhost:9390",
    },
    rateLimit: {
      enabled: process.env.RATE_LIMIT_ENABLED !== "false",
      max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
    },
  },
  api: {
    rest: {
      enabled: true,
      prefix: "/api",
      defaultLimit: 25,
      maxLimit: 200,
    },
    graphql: {
      enabled: process.env.GRAPHQL_ENABLED === "true",
      endpoint: "/graphql",
      playground: process.env.NODE_ENV !== "production",
      shadowCRUD: true,
    },
  },
};

const server = new EnterpriseServer(config);

async function main() {
  try {
    await server.initialize();

    // Register example content types for demo
    const schemaRegistry = server.getSchemaRegistry;

    // Add a demo "Article" content type if none registered
    if (schemaRegistry.getAll().length === 0) {
      schemaRegistry.register({
        uid: "api::article.article",
        kind: "collectionType",
        collectionName: "articles",
        displayName: "Article",
        singularName: "article",
        pluralName: "articles",
        description: "Blog articles",
        draftAndPublish: true,
        timestamps: true,
        attributes: {
          title: { name: "title", type: "string", required: true },
          slug: { name: "slug", type: "uid", required: true },
          content: { name: "content", type: "richtext" },
          excerpt: { name: "excerpt", type: "text" },
          featured: { name: "featured", type: "boolean", default: false },
          status: {
            name: "status",
            type: "enumeration",
            enum: ["draft", "published", "archived"],
            default: "draft",
          },
        },
      });
    }

    await server.start();
  } catch (error) {
    console.error("[Enterprise] Failed to start server:", error);
    process.exit(1);
  }
}

// Only run server when this file is the entry point (e.g. npm start from packages/backends/express).
// When imported by app (e.g. my-app/src/server.ts), do NOT start — the app calls server.initialize()/start() itself.
const isEntry = require.main === module;
if (isEntry) {
  process.on("SIGTERM", async () => {
    console.log("[Enterprise] Received SIGTERM, shutting down gracefully...");
    await server.stop();
    process.exit(0);
  });
  process.on("SIGINT", async () => {
    console.log("[Enterprise] Received SIGINT, shutting down gracefully...");
    await server.stop();
    process.exit(0);
  });
  main();
}
