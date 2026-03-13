import type {
  DatabaseConfig,
  FindManyParams,
  FindManyResult,
} from "@enterprise/types";

/**
 * Base Database Adapter Interface
 * All database adapters must implement this interface
 */
export interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // CRUD operations
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

  // Table/Collection management
  createTable(name: string, schema: TableSchema): Promise<void>;
  dropTable(name: string): Promise<void>;
  tableExists(name: string): Promise<boolean>;

  // Raw query
  raw(query: string, params?: unknown[]): Promise<unknown>;
}

export interface TableSchema {
  columns: ColumnDefinition[];
  indexes?: IndexDefinition[];
  primaryKey?: string;
  timestamps?: boolean;
}

export interface ColumnDefinition {
  name: string;
  type:
    | "string"
    | "text"
    | "integer"
    | "bigint"
    | "float"
    | "decimal"
    | "boolean"
    | "date"
    | "datetime"
    | "json"
    | "uuid";
  nullable?: boolean;
  default?: unknown;
  unique?: boolean;
  length?: number;
  precision?: number;
  scale?: number;
  references?: { table: string; column: string };
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  unique?: boolean;
}

/**
 * Factory to create a database adapter based on config
 */
export async function createDatabaseAdapter(
  config: DatabaseConfig,
): Promise<DatabaseAdapter> {
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
    case "sqlite": {
      const { SqliteAdapter } = await import("./adapters/SqliteAdapter");
      return new SqliteAdapter(config);
    }
    default:
      throw new Error(`Unsupported database client: ${config.client}. Use: postgres, mysql, mongodb, sqlite`);
  }
}
