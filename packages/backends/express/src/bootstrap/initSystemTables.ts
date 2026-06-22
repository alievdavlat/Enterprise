import type { DatabaseAdapter } from "@enterprise/database";

/**
 * Create the Enterprise system tables (users, tokens, media, webhooks, audit,
 * permissions, review workflows, i18n, preview tokens, content history, the
 * no-code builder tables, …) if they do not already exist, and run the small
 * idempotent column migrations for installs created before a column was added.
 * Idempotent: every block is guarded by tableExists / addColumnIfNotExists.
 */
export async function initSystemTables(db: DatabaseAdapter): Promise<void> {
    // Ensure enterprise_users table exists for auth + admin users list
    if (!(await db.tableExists("enterprise_users"))) {
      await db.createTable("enterprise_users", {
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
    if (!(await db.tableExists("enterprise_api_tokens"))) {
      await db.createTable("enterprise_api_tokens", {
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
    if (!(await db.tableExists("enterprise_roles"))) {
      await db.createTable("enterprise_roles", {
        columns: [
          { name: "name", type: "string", nullable: false },
          { name: "description", type: "text", nullable: true },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_roles created");
    }

    // Strapi-style: persist content type schemas in DB (Content Type Builder)
    if (!(await db.tableExists("enterprise_content_type_schemas"))) {
      await db.createTable("enterprise_content_type_schemas", {
        columns: [
          { name: "uid", type: "string", nullable: false, unique: true },
          { name: "schema", type: "text", nullable: false },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_content_type_schemas created");
    }

    // Strapi-style: key-value store for settings (overview, customization, i18n, etc.)
    if (!(await db.tableExists("enterprise_core_store_settings"))) {
      await db.createTable("enterprise_core_store_settings", {
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
    if (!(await db.tableExists("enterprise_webhooks"))) {
      await db.createTable("enterprise_webhooks", {
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
    if (!(await db.tableExists("enterprise_transfer_tokens"))) {
      await db.createTable("enterprise_transfer_tokens", {
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
    if (!(await db.tableExists("enterprise_audit_logs"))) {
      await db.createTable("enterprise_audit_logs", {
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
    if (!(await db.tableExists("enterprise_review_workflows"))) {
      await db.createTable("enterprise_review_workflows", {
        columns: [
          { name: "name", type: "string", nullable: false },
          { name: "description", type: "text", nullable: true },
          { name: "contentTypes", type: "text", nullable: true },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_review_workflows created");
    }
    if (!(await db.tableExists("enterprise_review_workflow_stages"))) {
      await db.createTable("enterprise_review_workflow_stages", {
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
    if (!(await db.tableExists("enterprise_locales"))) {
      await db.createTable("enterprise_locales", {
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
    if (!(await db.tableExists("enterprise_permissions"))) {
      await db.createTable("enterprise_permissions", {
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
    if (!(await db.tableExists("enterprise_media"))) {
      await db.createTable("enterprise_media", {
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
    } else if (typeof (db as { addColumnIfNotExists?: unknown }).addColumnIfNotExists === "function") {
      // Migration for existing installs: ensure responsive-image columns exist.
      // Call as a member (not a detached reference) so `this` stays bound inside the adapter.
      const migratable = db as DatabaseAdapter & { addColumnIfNotExists: (t: string, c: string, type: string, opts?: { nullable?: boolean }) => Promise<void> };
      try {
        await migratable.addColumnIfNotExists("enterprise_media", "width", "integer", { nullable: true });
        await migratable.addColumnIfNotExists("enterprise_media", "height", "integer", { nullable: true });
        await migratable.addColumnIfNotExists("enterprise_media", "formats", "text", { nullable: true });
      } catch (err) {
        console.warn("[Enterprise] Could not migrate enterprise_media:", err);
      }
    }

    // Media folders (for organizing assets)
    if (!(await db.tableExists("enterprise_media_folders"))) {
      await db.createTable("enterprise_media_folders", {
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
    if (!(await db.tableExists("enterprise_email_templates"))) {
      await db.createTable("enterprise_email_templates", {
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
        const cols = await db.findMany("enterprise_email_templates", {
          pagination: { page: 1, pageSize: 1 },
        });
        const sample = cols.data?.[0] as Record<string, unknown> | undefined;
        if (sample && !("bodyType" in sample)) {
          if (typeof (db as any).addColumn === "function") {
            await (db as any).addColumn("enterprise_email_templates", {
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

    // OAuth providers (Phase 19). One row per IdP (github, discord, google,
    // etc.) with the admin-supplied client_id / client_secret. Generic flow
    // router reads this table at request time so toggles take effect live.
    if (!(await db.tableExists("enterprise_auth_providers"))) {
      await db.createTable("enterprise_auth_providers", {
        columns: [
          { name: "name", type: "string", nullable: false, unique: true },
          { name: "enabled", type: "boolean", nullable: false },
          { name: "clientId", type: "string", nullable: true },
          { name: "clientSecret", type: "string", nullable: true },
          { name: "scope", type: "string", nullable: true },
          { name: "redirectUri", type: "string", nullable: true },
          { name: "allowedRedirects", type: "text", nullable: true },
          // Custom OAuth providers — when set, the row is its own preset
          // instead of pointing at a built-in preset. Holds authorizeUrl /
          // tokenUrl / userInfoUrl / displayName / normaliser code.
          { name: "isCustom", type: "boolean", nullable: true },
          { name: "customConfig", type: "text", nullable: true },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_auth_providers created");
    } else if (typeof (db as { addColumnIfNotExists?: unknown }).addColumnIfNotExists === "function") {
      // Call as a member (not a detached reference) so `this` stays bound inside the adapter.
      const migratable = db as DatabaseAdapter & { addColumnIfNotExists: (t: string, c: string, type: string, opts?: { nullable?: boolean }) => Promise<void> };
      try {
        await migratable.addColumnIfNotExists("enterprise_auth_providers", "isCustom", "boolean", { nullable: true });
        await migratable.addColumnIfNotExists("enterprise_auth_providers", "customConfig", "text", { nullable: true });
      } catch {
        /* best-effort migration */
      }
    }

    // User-defined middlewares created from the admin UI (no-code builder).
    // Compiled to (req,res,next) handlers and dispatched by a single Express
    // middleware so changes hot-swap without restart.
    if (!(await db.tableExists("enterprise_user_middlewares"))) {
      await db.createTable("enterprise_user_middlewares", {
        columns: [
          { name: "name", type: "string", nullable: false, unique: true },
          { name: "code", type: "text", nullable: false },
          { name: "enabled", type: "boolean", nullable: false },
          { name: "priority", type: "integer", nullable: false },
          { name: "description", type: "text", nullable: true },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_user_middlewares created");
    }

    // User-defined custom routes (no-code builder). Each row is a (method,
    // path, code) trio — the dispatcher matches the request against the
    // ordered list and invokes the compiled handler.
    if (!(await db.tableExists("enterprise_user_routes"))) {
      await db.createTable("enterprise_user_routes", {
        columns: [
          { name: "name", type: "string", nullable: false, unique: true },
          { name: "method", type: "string", nullable: false },
          { name: "path", type: "string", nullable: false },
          { name: "code", type: "text", nullable: false },
          { name: "enabled", type: "boolean", nullable: false },
          { name: "description", type: "text", nullable: true },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_user_routes created");
    }

    // User-defined services (Phase 16.4). Compiled function reachable via
    // `app.userService(name)` from any route / lifecycle / cron.
    if (!(await db.tableExists("enterprise_user_services"))) {
      await db.createTable("enterprise_user_services", {
        columns: [
          { name: "name", type: "string", nullable: false, unique: true },
          { name: "code", type: "text", nullable: false },
          { name: "enabled", type: "boolean", nullable: false },
          { name: "description", type: "text", nullable: true },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_user_services created");
    }

    // User-defined lifecycle hooks (Phase 16.5). Wired into LifecycleManager
    // so beforeCreate/afterUpdate/etc fire for content-type CRUD.
    if (!(await db.tableExists("enterprise_user_lifecycles"))) {
      await db.createTable("enterprise_user_lifecycles", {
        columns: [
          { name: "name", type: "string", nullable: false, unique: true },
          { name: "model", type: "string", nullable: false },
          { name: "event", type: "string", nullable: false },
          { name: "code", type: "text", nullable: false },
          { name: "enabled", type: "boolean", nullable: false },
          { name: "description", type: "text", nullable: true },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_user_lifecycles created");
    }

    // User-defined plugin bundles (Phase 16.6). A row references existing
    // services/routes/middlewares/lifecycles by name to group them as one
    // shippable unit. Toggle disabled → all bundled items also disable.
    if (!(await db.tableExists("enterprise_user_plugins"))) {
      await db.createTable("enterprise_user_plugins", {
        columns: [
          { name: "name", type: "string", nullable: false, unique: true },
          { name: "version", type: "string", nullable: true },
          { name: "description", type: "text", nullable: true },
          { name: "enabled", type: "boolean", nullable: false },
          { name: "manifest", type: "text", nullable: true },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_user_plugins created");
    }

    // User-defined extensions (Phase 16.8). Pre/post hooks that wrap a
    // built-in plugin action (e.g. upload.afterUpload to push to S3 mirror,
    // email.beforeSend to add a footer). Built-in plugins read this table.
    if (!(await db.tableExists("enterprise_user_extensions"))) {
      await db.createTable("enterprise_user_extensions", {
        columns: [
          { name: "name", type: "string", nullable: false, unique: true },
          { name: "target", type: "string", nullable: false },
          { name: "phase", type: "string", nullable: false },
          { name: "code", type: "text", nullable: false },
          { name: "enabled", type: "boolean", nullable: false },
          { name: "description", type: "text", nullable: true },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_user_extensions created");
    }

    // User-defined cron jobs created from the admin UI (no-code builder).
    // Each row carries a schedule + a JS snippet that's compiled to a handler
    // at register time (see applyUserCronJobs).
    if (!(await db.tableExists("enterprise_user_cron_jobs"))) {
      await db.createTable("enterprise_user_cron_jobs", {
        columns: [
          { name: "name", type: "string", nullable: false, unique: true },
          { name: "schedule", type: "string", nullable: false },
          { name: "code", type: "text", nullable: false },
          { name: "enabled", type: "boolean", nullable: false },
          { name: "description", type: "text", nullable: true },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_user_cron_jobs created");
    }

    // Preview tokens (Strapi v5: short-lived tokens that grant public read of a draft entry)
    if (!(await db.tableExists("enterprise_preview_tokens"))) {
      await db.createTable("enterprise_preview_tokens", {
        columns: [
          { name: "token", type: "string", nullable: false, unique: true },
          { name: "uid", type: "string", nullable: false },
          { name: "documentId", type: "string", nullable: true },
          { name: "entryId", type: "integer", nullable: true },
          { name: "expiresAt", type: "datetime", nullable: false },
          { name: "userId", type: "integer", nullable: true },
        ],
        timestamps: true,
      });
      console.log("[Enterprise] Table enterprise_preview_tokens created");
    }

    // Content history / versioning (Strapi v5 Enterprise: revision per update/publish)
    if (!(await db.tableExists("enterprise_content_history"))) {
      await db.createTable("enterprise_content_history", {
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
}
