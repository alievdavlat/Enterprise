// ==========================================
// Enterprise CMS - Shared TypeScript Types
// ==========================================

// ---- Schema / Content Type Types ----
export type FieldType =
  | "string"
  | "text"
  | "richtext"
  | "integer"
  | "biginteger"
  | "float"
  | "decimal"
  | "boolean"
  | "email"
  | "password"
  | "date"
  | "datetime"
  | "time"
  | "json"
  | "enumeration"
  | "media"
  | "relation"
  | "uid"
  | "component"
  | "dynamiczone";

export interface FieldDefinition {
  name: string;
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  default?: unknown;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  enum?: string[];
  regex?: string;
  private?: boolean;
  // Relation fields
  relation?: "oneToOne" | "oneToMany" | "manyToOne" | "manyToMany";
  target?: string;
  // Component/Dynamic zone
  component?: string;
  components?: string[];
  repeatable?: boolean;
  // Media
  allowedTypes?: ("images" | "videos" | "files" | "audios")[];
  multiple?: boolean;
}

export interface ContentTypeSchema {
  uid: string;
  kind: "collectionType" | "singleType" | "component" | "dynamiczone";
  collectionName: string;
  displayName: string;
  singularName: string;
  pluralName: string;
  description?: string;
  draftAndPublish?: boolean;
  pluginOptions?: Record<string, unknown>;
  attributes: Record<string, FieldDefinition>;
  timestamps?: boolean;
  softDelete?: boolean;
  category?: string;
  viewConfig?: {
    entryTitle?: string;
    displayedFields?: string[];
  };
}

// ---- Middleware Types ----
export interface MiddlewareConfig {
  name: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export type MiddlewareFn<TContext = unknown> = (
  ctx: TContext,
  next: () => Promise<void>,
) => Promise<void>;

// ---- Plugin Types ----
export interface PluginConfig {
  enabled: boolean;
  resolve?: string;
  config?: Record<string, unknown>;
}

export interface Plugin {
  name: string;
  version: string;
  description?: string;
  register?: (app: EnterpriseApp) => void | Promise<void>;
  bootstrap?: (app: EnterpriseApp) => void | Promise<void>;
  destroy?: () => void | Promise<void>;
  contentTypes?: ContentTypeSchema[];
  routes?: RouteDefinition[];
  middlewares?: MiddlewareDefinition[];
  hooks?: HookDefinition[];
}

// ---- Hook Types ----
export type HookEvent =
  | "beforeCreate"
  | "afterCreate"
  | "beforeFindOne"
  | "afterFindOne"
  | "beforeFindMany"
  | "afterFindMany"
  | "beforeUpdate"
  | "afterUpdate"
  | "beforeDelete"
  | "afterDelete"
  | "beforeCount"
  | "afterCount";

export interface HookDefinition {
  event: HookEvent;
  handler: (data: unknown) => Promise<unknown> | unknown;
}

export interface HookContext {
  model: string;
  action: HookEvent;
  params: Record<string, unknown>;
  result?: unknown;
}

// ---- Route Types ----
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RouteDefinition {
  method: HttpMethod;
  path: string;
  handler: string;
  config?: {
    auth?: boolean | { scope?: string[] };
    policies?: string[];
    middlewares?: string[];
    description?: string;
    tags?: string[];
  };
}

export interface MiddlewareDefinition {
  name: string;
  execute: MiddlewareFn;
}

// ---- Database Types ----
export type DatabaseClient = "mysql" | "postgres" | "mongodb" | "sqlite";

export interface DatabaseConfig {
  client: DatabaseClient;
  host?: string;
  port?: number;
  database?: string;
  /** SQLite: path to database file (e.g. ./.tmp/data.db) */
  filename?: string;
  username?: string;
  password?: string;
  uri?: string; // Full connection string (for MongoDB)
  ssl?: boolean;
  pool?: {
    min?: number;
    max?: number;
  };
  debug?: boolean;
}

// ---- Query / Filter Types ----
export interface FilterOperators {
  $eq?: unknown;
  $ne?: unknown;
  $lt?: number | string;
  $lte?: number | string;
  $gt?: number | string;
  $gte?: number | string;
  $in?: unknown[];
  $notIn?: unknown[];
  $contains?: string;
  $notContains?: string;
  $startsWith?: string;
  $endsWith?: string;
  $null?: boolean;
  $notNull?: boolean;
  $between?: [unknown, unknown];
}

export type FilterValue = FilterOperators | unknown;
export type Filters = Record<string, FilterValue>;

export interface PaginationInput {
  page?: number;
  pageSize?: number;
  start?: number;
  limit?: number;
  withCount?: boolean;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface SortInput {
  field: string;
  direction: "asc" | "desc";
}

export interface FindManyParams {
  filters?: Filters;
  sort?: SortInput | SortInput[] | string;
  pagination?: PaginationInput;
  populate?: string[] | Record<string, unknown>;
  fields?: string[];
  locale?: string;
  status?: "draft" | "published";
}

export interface FindManyResult<T> {
  data: T[];
  meta: {
    pagination: PaginationMeta;
  };
}

/** Persistent 24-char document identifier (replaces unstable id for API) */
export type DocumentId = string;

export interface DocumentMetadata {
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | number;
  updatedBy?: string | number;
}

/** Document = one version of a content entry (stable documentId, optional status/locale) */
export interface Document<T = Record<string, unknown>> {
  documentId: DocumentId;
  id: number | string;
  status?: "draft" | "published";
  locale?: string;
  /** Metadata (publishedAt, createdAt, updatedAt, createdBy, updatedBy) */
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | number;
  updatedBy?: string | number;
  [key: string]: unknown;
}

export interface FindOneParams {
  documentId: DocumentId;
  status?: "draft" | "published";
  locale?: string;
  fields?: string[] | Record<string, unknown>;
  populate?: string[] | Record<string, unknown>;
}

export interface FindFirstParams {
  filters?: Filters;
  status?: "draft" | "published";
  locale?: string;
  fields?: string[] | Record<string, unknown>;
  populate?: string[] | Record<string, unknown>;
}

export interface DocumentServiceCreateParams<T = Record<string, unknown>> {
  data: T;
  status?: "draft" | "published";
  locale?: string;
  fields?: string[] | Record<string, unknown>;
  populate?: string[] | Record<string, unknown>;
}

export interface DocumentServiceUpdateParams<T = Record<string, unknown>> {
  documentId: DocumentId;
  data: Partial<T>;
  status?: "draft" | "published";
  locale?: string;
  fields?: string[] | Record<string, unknown>;
  populate?: string[] | Record<string, unknown>;
}

export interface DocumentServiceDeleteParams {
  documentId: DocumentId;
  locale?: string;
}

/** Document Service API documents(uid).findOne(findMany, create, update, delete, publish, unpublish, discardDraft, count) */
export interface DocumentServiceApi<T = Record<string, unknown>> {
  findOne(params: FindOneParams): Promise<Document<T> | null>;
  findFirst(params?: FindFirstParams): Promise<Document<T> | null>;
  findMany(params?: FindManyParams): Promise<Document<T>[]>;
  create(params: DocumentServiceCreateParams<T>): Promise<Document<T>>;
  update(params: DocumentServiceUpdateParams<T>): Promise<Document<T>>;
  delete(params: DocumentServiceDeleteParams): Promise<Document<T> | null>;
  publish(params: { documentId: DocumentId; locale?: string }): Promise<Document<T>>;
  unpublish(params: { documentId: DocumentId; locale?: string }): Promise<Document<T>>;
  discardDraft(params: { documentId: DocumentId; locale?: string }): Promise<Document<T>>;
  count(params?: { filters?: Filters; status?: "draft" | "published"; locale?: string }): Promise<number>;
}

/** Minimal DB interface for DocumentService (avoids core ↔ database circular dependency) */
export interface DocumentServiceDb {
  findMany(
    collection: string,
    params?: FindManyParams,
  ): Promise<FindManyResult<Record<string, unknown>>>;
  findOne(
    collection: string,
    id: string | number,
  ): Promise<Record<string, unknown> | null>;
  findOneBy(
    collection: string,
    where: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null>;
  create(
    collection: string,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  update(
    collection: string,
    id: string | number,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  delete(
    collection: string,
    id: string | number,
  ): Promise<Record<string, unknown>>;
  count(collection: string, filters?: Record<string, unknown>): Promise<number>;
}

// ---- Auth / User Types ----
export interface JwtPayload {
  id: string | number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AdminUser {
  id: string | number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRole {
  id: string | number;
  name: string;
  code: string;
  permissions: Permission[];
}

export interface Permission {
  id: string | number;
  action: string;
  subject?: string;
  fields?: string[];
  conditions?: string[];
}

// ---- API Response Types ----
export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
  error?: ApiError;
}

export interface ApiError {
  status: number;
  name: string;
  message: string;
  details?: Record<string, unknown>;
}

// ---- App Types ----
export interface EnterpriseConfig {
  appName: string;
  url: string;
  port: number;
  /** Project root path for loading Strapi v5 schema.json from src/api content-types */
  appPath?: string;
  admin: {
    apiToken?: string;
    auth: {
      secret: string;
    };
  };
  database: DatabaseConfig;
  server: {
    host: string;
    port: number;
    cors?: {
      enabled: boolean;
      origin?: string | string[];
    };
    rateLimit?: {
      enabled: boolean;
      max?: number;
      interval?: string;
    };
  };
  api: {
    rest?: {
      enabled: boolean;
      prefix?: string;
      defaultLimit?: number;
      maxLimit?: number;
    };
    graphql?: {
      enabled: boolean;
      endpoint?: string;
      playground?: boolean;
      shadowCRUD?: boolean;
    };
  };
  plugins?: Record<string, PluginConfig>;
  middlewares?: (string | MiddlewareConfig)[];
}

export interface EnterpriseApp {
  config: EnterpriseConfig;
  db: unknown;
  plugins: Map<string, Plugin>;
  contentTypes: Map<string, ContentTypeSchema>;
  start(): Promise<void>;
  stop(): Promise<void>;
  register(plugin: Plugin): void;
  use(middleware: MiddlewareFn): void;
}

// ---- Media Library Types ----
export interface MediaFile {
  id: string | number;
  name: string;
  alternativeText?: string;
  caption?: string;
  width?: number;
  height?: number;
  formats?: Record<string, MediaFormat>;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl?: string;
  provider: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaFormat {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  path?: string;
  width: number;
  height: number;
  size: number;
  url: string;
}

// ---- Webhook Types ----
export interface WebhookDefinition {
  id: string | number;
  name: string;
  url: string;
  headers?: Record<string, string>;
  events: WebhookEvent[];
  enabled: boolean;
}

export type WebhookEvent =
  | "entry.create"
  | "entry.update"
  | "entry.delete"
  | "entry.publish"
  | "entry.unpublish"
  | "media.create"
  | "media.update"
  | "media.delete";

// ---- i18n Types ----
export interface LocaleDefinition {
  code: string;
  name: string;
  isDefault?: boolean;
}

export default {};
