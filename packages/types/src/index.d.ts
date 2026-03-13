export type FieldType = "string" | "text" | "richtext" | "integer" | "biginteger" | "float" | "decimal" | "boolean" | "email" | "password" | "date" | "datetime" | "time" | "json" | "enumeration" | "media" | "relation" | "uid" | "component" | "dynamiczone";
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
    relation?: "oneToOne" | "oneToMany" | "manyToOne" | "manyToMany";
    target?: string;
    component?: string;
    components?: string[];
    repeatable?: boolean;
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
export interface MiddlewareConfig {
    name: string;
    enabled: boolean;
    config?: Record<string, unknown>;
}
export type MiddlewareFn<TContext = unknown> = (ctx: TContext, next: () => Promise<void>) => Promise<void>;
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
export type HookEvent = "beforeCreate" | "afterCreate" | "beforeFindOne" | "afterFindOne" | "beforeFindMany" | "afterFindMany" | "beforeUpdate" | "afterUpdate" | "beforeDelete" | "afterDelete" | "beforeCount" | "afterCount";
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
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export interface RouteDefinition {
    method: HttpMethod;
    path: string;
    handler: string;
    config?: {
        auth?: boolean | {
            scope?: string[];
        };
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
export type DatabaseClient = "mysql" | "postgres" | "mongodb" | "sqlite";
export interface DatabaseConfig {
    client: DatabaseClient;
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    uri?: string;
    ssl?: boolean;
    pool?: {
        min?: number;
        max?: number;
    };
    debug?: boolean;
}
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
export interface EnterpriseConfig {
    appName: string;
    url: string;
    port: number;
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
export interface WebhookDefinition {
    id: string | number;
    name: string;
    url: string;
    headers?: Record<string, string>;
    events: WebhookEvent[];
    enabled: boolean;
}
export type WebhookEvent = "entry.create" | "entry.update" | "entry.delete" | "entry.publish" | "entry.unpublish" | "media.create" | "media.update" | "media.delete";
export interface LocaleDefinition {
    code: string;
    name: string;
    isDefault?: boolean;
}
declare const _default: {};
export default _default;
//# sourceMappingURL=index.d.ts.map