import "dotenv/config";
import { SchemaRegistry, PluginRegistry, LifecycleManager } from "@enterprise/core";
import { type DatabaseAdapter } from "@enterprise/database";
import type { EnterpriseConfig } from "@enterprise/types";
export declare class EnterpriseServer {
    private app;
    private schemaRegistry;
    private pluginRegistry;
    private lifecycleManager;
    private db;
    private config;
    private graphqlServer;
    constructor(config: EnterpriseConfig);
    initialize(): Promise<void>;
    private setupMiddlewares;
    private setupRoutes;
    private setupGraphQL;
    get getSchemaRegistry(): SchemaRegistry;
    get getLifecycleManager(): LifecycleManager;
    get getHookManager(): LifecycleManager;
    get getDb(): DatabaseAdapter;
    start(): Promise<void>;
    stop(): Promise<void>;
}
export { SchemaRegistry, LifecycleManager, PluginRegistry };
//# sourceMappingURL=server.d.ts.map