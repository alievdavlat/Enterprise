import type { Router } from "express";
import type { SchemaRegistry } from "@enterprise/core";
import type { DatabaseAdapter } from "@enterprise/database";
import type { ContentTypeSchema } from "@enterprise/types";

/** Persisted content-type schemas table (schema-as-code mirror lives on disk). */
export const SCHEMAS_TABLE = "enterprise_content_type_schemas";
/** Strapi-style key/value settings store. */
export const STORE_TABLE = "enterprise_core_store_settings";

/** Options accepted by `createAdminRouter`, shared with every controller. */
export interface AdminRouterOptions {
  onSchemaRegistered?: (schema: ContentTypeSchema) => void;
  /** If set, schemas are synced to the project schema/ folder (schema-as-code for deploy). */
  getProjectRoot?: () => string;
  /** Discovered runtime artifacts (plugins, middlewares, cron, services). */
  getDiscoveredArtifacts?: () => {
    plugins: { registered: string[]; disabled: string[] };
    middlewares: { resolved: string[]; unresolved: string[]; discovered: string[] };
    cron: { name: string; schedule: string; running: boolean }[];
    services: { registered: string[]; skipped: string[] };
  };
  /** Re-sync PermissionManager from `enterprise_permissions` after role edits. */
  reloadPermissions?: () => Promise<void> | void;
  /** Re-evaluate backup schedule (register/unregister cron) after admin saves it. */
  applyBackupSchedule?: () => Promise<void> | void;
  /** Run a backup right now; returns the written file path. */
  runBackupNow?: () => Promise<string | null>;
  /** List existing backup files so the UI can render history. */
  listBackups?: () => Promise<{ name: string; size: number; createdAt: string }[]>;
  /** Rebuild the user-defined cron jobs after CRUD on enterprise_user_cron_jobs. */
  reloadUserCronJobs?: () => Promise<void> | void;
  /** Rebuild the user-defined middlewares after CRUD on enterprise_user_middlewares. */
  reloadUserMiddlewares?: () => Promise<void> | void;
  /** Rebuild the user-defined routes after CRUD on enterprise_user_routes. */
  reloadUserRoutes?: () => Promise<void> | void;
  /** Rebuild user services / lifecycles / extensions / plugins after CRUD. */
  reloadUserServices?: () => Promise<void> | void;
  reloadUserLifecycles?: () => Promise<void> | void;
  reloadUserExtensions?: () => Promise<void> | void;
  reloadUserPlugins?: () => Promise<void> | void;
  /** Re-read the admin::middlewares toggle map so core middleware on/off applies without a restart. */
  reloadCoreMiddlewares?: () => Promise<void> | void;
  /** Live PermissionManager — exposed for the /actions and /conditions endpoints. */
  permissionManager?: import("@enterprise/core").PermissionManager;
}

/**
 * Shared context handed to every admin controller's `register…` function so it
 * can mount its routes on the common router with access to the DB, the schema
 * registry, and the orchestrator options/callbacks.
 */
export interface AdminCtx {
  router: Router;
  db: DatabaseAdapter;
  schemaRegistry: SchemaRegistry;
  options: AdminRouterOptions;
}

/** Normalize an Express `:param` (which may be string | string[]) to a numeric id when possible. */
export function paramId(p: string | number | string[] | undefined): number | string {
  const s = Array.isArray(p) ? p[0] : p;
  if (s === undefined) return 0;
  const n = Number(s);
  return Number.isNaN(n) || (n === 0 && s !== "0") ? s : n;
}
