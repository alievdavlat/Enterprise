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

  /** Optional: get existing column names (for schema migration) */
  getTableColumns?(tableName: string): Promise<string[]>;
  /** Optional: add column if not exists (for schema migration) */
  addColumnIfNotExists?(
    tableName: string,
    columnName: string,
    type: string,
    options?: { nullable?: boolean; length?: number },
  ): Promise<void>;

  // Raw query
  raw(query: string, params?: unknown[]): Promise<unknown>;

  /**
   * Optional: run `fn` inside a database transaction. The `trx` argument
   * passed to `fn` is a transactional clone of this adapter — every
   * subsequent CRUD call routes through the same connection so BEGIN /
   * COMMIT / ROLLBACK applies as expected.
   *
   * Adapters that can't support real transactions (e.g. Mongo without a
   * replica set) may omit this; consumers should use `runInTransaction()`
   * to get a graceful fallback to non-atomic execution.
   */
  transaction?<T>(fn: (trx: DatabaseAdapter) => Promise<T>): Promise<T>;
}

/**
 * Run `fn` inside a transaction if the adapter supports it; otherwise run
 * `fn` directly with a warning. Use this from route/service code so the
 * happy path is atomic on Postgres/SQLite while still working on adapters
 * that don't (yet) implement transactions.
 */
export async function runInTransaction<T>(
  adapter: DatabaseAdapter,
  fn: (trx: DatabaseAdapter) => Promise<T>,
): Promise<T> {
  if (typeof adapter.transaction === "function") {
    return adapter.transaction(fn);
  }
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[enterprise/database] transaction() not implemented for current adapter; running fn() without atomicity",
    );
  }
  return fn(adapter);
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
