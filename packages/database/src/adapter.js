/**
 * Factory to create a database adapter based on config
 */
export async function createDatabaseAdapter(config) {
    switch (config.client) {
        case "postgres": {
            const { PostgresAdapter } = await import("./adapters/PostgresAdapter");
            return new PostgresAdapter(config);
        }
        case "mysql": {
            const { MysqlAdapter } = await import("./adapters/MysqlAdapter");
            return new MysqlAdapter(config);
        }
        case "mongodb": {
            const { MongoAdapter } = await import("./adapters/MongoAdapter");
            return new MongoAdapter(config);
        }
        default:
            throw new Error(`Unsupported database client: ${config.client}`);
    }
}
//# sourceMappingURL=adapter.js.map