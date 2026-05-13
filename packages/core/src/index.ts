export {
  PluginRegistry,
  // New factory API (preferred)
  createEmailPlugin,
  createI18nPlugin,
  createUploadPlugin,
  createUsersPermissionsPlugin,
  createSeoPlugin,
  // Back-compat: pre-created plugin instances (deprecated)
  emailPlugin,
  i18nPlugin,
  uploadPlugin,
  usersPermissionsPlugin,
  seoPlugin,
} from "./plugin/PluginRegistry";

// Built-in plugin service classes — expose so user code can extend them
// or instantiate without going through the registry (e.g. tests).
export { EmailService as PluginEmailService } from "./plugin/built-in/email";
export type { EmailProviderConfig } from "./plugin/built-in/email";
export { LocaleService } from "./plugin/built-in/i18n";
export type { Locale } from "./plugin/built-in/i18n";
export { UploadService } from "./plugin/built-in/upload";
export type { UploadInput, UploadConfig as PluginUploadConfig, MediaRecord } from "./plugin/built-in/upload";
export { AuthService } from "./plugin/built-in/users-permissions";
export type { AuthUser, AuthConfig } from "./plugin/built-in/users-permissions";
export { SeoService } from "./plugin/built-in/seo";
export type { SeoComponent } from "./plugin/built-in/seo";

export { LifecycleManager, ModelLifecycles } from "./lifecycle/LifecycleManager";
/** @deprecated Use LifecycleManager (server lifecycle). For React hooks use @enterprise/hooks. */
export { LifecycleManager as HookManager } from "./lifecycle/LifecycleManager";
export {
  MiddlewareManager,
  createLoggerMiddleware,
  createRateLimitMiddleware,
  createCorsMiddleware,
  createBodySizeLimitMiddleware,
} from "./middlewares/MiddlewareManager";
export { SchemaRegistry } from "./schema/SchemaRegistry";
export { QueryBuilder } from "./query/QueryBuilder";
export { DocumentService } from "./document/DocumentService";
export {
  loadStrapiSchema,
  loadStrapiComponent,
  buildContentTypeUid,
  buildComponentUid,
  type StrapiSchemaJson,
  type StrapiComponentJson,
} from "./schema/loadStrapiSchema";
export {
  PermissionManager,
  DEFAULT_ACTIONS,
  type PermissionRule,
  type Action,
  type Role,
  type ConditionFn,
} from "./permissions/PermissionManager";
export {
  getDefaultUploadConfig,
  isAllowedMime,
  isWithinSizeLimit,
  type UploadConfig,
} from "./upload/UploadConfig";
export { buildOpenApiSpec, type OpenApiOptions } from "./openapi/buildOpenApiSpec";
export {
  NoopEmailService,
  type IEmailService,
  type SendOptions,
} from "./email/EmailService";
export { CronManager, type CronJob } from "./cron/CronManager";
export {
  ServiceRegistry,
  type Service,
  type ServiceFactory,
} from "./services/ServiceRegistry";
