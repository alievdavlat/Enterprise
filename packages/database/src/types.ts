export type DatabaseClient = "postgresql" | "mysql" | "mongodb" | "sqlite";

export interface DatabaseConfig {
  client: DatabaseClient;
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  url?: string;
  ssl?: boolean;
  pool?: {
    min?: number;
    max?: number;
  };
}

export interface QueryOptions {
  where?: Record<string, unknown>;
  orderBy?: { field: string; direction: "asc" | "desc" }[];
  limit?: number;
  offset?: number;
  select?: string[];
  populate?: string[];
}

export interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query<T = unknown>(model: string, options?: QueryOptions): Promise<T[]>;
  findOne<T = unknown>(model: string, id: string | number): Promise<T | null>;
  create<T = unknown>(model: string, data: Record<string, unknown>): Promise<T>;
  update<T = unknown>(
    model: string,
    id: string | number,
    data: Record<string, unknown>,
  ): Promise<T>;
  delete(model: string, id: string | number): Promise<void>;
  count(model: string, where?: Record<string, unknown>): Promise<number>;
  raw(query: string, bindings?: unknown[]): Promise<unknown>;
}
