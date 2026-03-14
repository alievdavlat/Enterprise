import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import type {
  DatabaseConfig,
  FindManyParams,
  FindManyResult,
} from "@enterprise/types";
import type { DatabaseAdapter, TableSchema } from "../adapter";
import { QueryBuilder } from "@enterprise/core";

/** Convert Postgres-style $1,$2 placeholders to SQLite ?; ILIKE -> LIKE */
function toSqlitePlaceholders(sql: string): string {
  return sql.replace(/\$\d+/g, "?").replace(/ILIKE/gi, "LIKE");
}

/** Convert JS values to types SQLite can bind (number, string, bigint, buffer, null) */
function toSqliteBindValue(value: unknown): string | number | bigint | Buffer | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" || Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "bigint") return value;
  if (Buffer.isBuffer(value)) return value;
  return String(value);
}

/** SQLite type mapping */
function sqliteType(type: string, length?: number): string {
  const map: Record<string, string> = {
    string: `VARCHAR(${length ?? 255})`,
    text: "TEXT",
    integer: "INTEGER",
    bigint: "INTEGER",
    float: "REAL",
    decimal: "REAL",
    boolean: "INTEGER",
    date: "TEXT",
    datetime: "TEXT",
    json: "TEXT",
    uuid: "TEXT",
  };
  return map[type] ?? "TEXT";
}

export class SqliteAdapter implements DatabaseAdapter {
  private db: Database.Database | null = null;
  private config: DatabaseConfig;
  private queryBuilder = new QueryBuilder();
  private _isConnected = false;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    const filename = this.config.filename ?? "./.tmp/data.db";
    const dir = path.dirname(filename);
    if (dir !== "." && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new Database(path.resolve(filename));
    this.db.pragma("journal_mode = WAL");
    this._isConnected = true;
    console.log("[SqliteAdapter] Connected to SQLite:", path.resolve(filename));
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this._isConnected = false;
      console.log("[SqliteAdapter] Disconnected");
    }
  }

  isConnected(): boolean {
    return this._isConnected;
  }

  private getDb(): Database.Database {
    if (!this.db) throw new Error("Not connected to SQLite");
    return this.db;
  }

  async findMany(
    collection: string,
    params: FindManyParams = {},
  ): Promise<FindManyResult<Record<string, unknown>>> {
    const db = this.getDb();
    const { filters = {}, sort, pagination } = params;
    const pag = this.queryBuilder.parsePagination(pagination);
    const where = this.queryBuilder.buildSqlWhere(filters, collection);
    const orderBy = this.queryBuilder.buildSqlOrderBy(sort);
    const whereSql = toSqlitePlaceholders(where.sql);
    const safeParams = (where.params as unknown[]).map(toSqliteBindValue);
    const paramsList = [...safeParams, pag.limit, pag.offset];

    const dataSql = `SELECT * FROM "${collection}" WHERE ${whereSql} ${orderBy} LIMIT ? OFFSET ?`;
    const countSql = `SELECT COUNT(*) as total FROM "${collection}" WHERE ${whereSql}`;

    const dataRows = db.prepare(dataSql).all(...paramsList) as Record<string, unknown>[];
    const countRow = db.prepare(countSql).get(...safeParams) as { total: number };
    const total = countRow?.total ?? 0;
    const pageCount = Math.ceil(total / pag.pageSize);

    return {
      data: dataRows,
      meta: {
        pagination: {
          page: pag.page,
          pageSize: pag.pageSize,
          pageCount,
          total,
        },
      },
    };
  }

  async findOne(
    collection: string,
    id: string | number,
  ): Promise<Record<string, unknown> | null> {
    const row = this.getDb()
      .prepare(`SELECT * FROM "${collection}" WHERE id = ? LIMIT 1`)
      .get(id) as Record<string, unknown> | undefined;
    return row ?? null;
  }

  async findOneBy(
    collection: string,
    where: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> {
    const { sql, params } = this.queryBuilder.buildSqlWhere(where);
    const row = this.getDb()
      .prepare(`SELECT * FROM "${collection}" WHERE ${toSqlitePlaceholders(sql)} LIMIT 1`)
      .get(...params) as Record<string, unknown> | undefined;
    return row ?? null;
  }

  async create(
    collection: string,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const db = this.getDb();
    const keys = Object.keys(data);
    const values = keys.map((k) => toSqliteBindValue(data[k]));
    const placeholders = keys.map(() => "?").join(", ");
    const columns = keys.map((k) => `"${k}"`).join(", ");
    const now = new Date().toISOString();
    const sql = `INSERT INTO "${collection}" (${columns}, created_at, updated_at) VALUES (${placeholders}, ?, ?)`;
    const stmt = db.prepare(sql);
    stmt.run(...values, now, now);
    const id = (db.prepare("SELECT last_insert_rowid() as id").get() as { id: number }).id;
    const row = db.prepare(`SELECT * FROM "${collection}" WHERE id = ?`).get(id) as Record<string, unknown>;
    return row;
  }

  async update(
    collection: string,
    id: string | number,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const db = this.getDb();
    const keys = Object.keys(data);
    const values = keys.map((k) => toSqliteBindValue(data[k]));
    const setClauses = keys.map((k) => `"${k}" = ?`).join(", ");
    const now = new Date().toISOString();
    const sql = `UPDATE "${collection}" SET ${setClauses}, updated_at = ? WHERE id = ?`;
    const result = db.prepare(sql).run(...values, now, id);
    if (result.changes === 0) throw new Error(`Record not found: ${id}`);
    const row = db.prepare(`SELECT * FROM "${collection}" WHERE id = ?`).get(id) as Record<string, unknown>;
    return row;
  }

  async delete(
    collection: string,
    id: string | number,
  ): Promise<Record<string, unknown>> {
    const db = this.getDb();
    const row = db.prepare(`SELECT * FROM "${collection}" WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
    if (!row) throw new Error(`Record not found: ${id}`);
    db.prepare(`DELETE FROM "${collection}" WHERE id = ?`).run(id);
    return row;
  }

  async count(
    collection: string,
    filters: Record<string, unknown> = {},
  ): Promise<number> {
    const { sql, params } = this.queryBuilder.buildSqlWhere(filters);
    const safeParams = (params as unknown[]).map(toSqliteBindValue);
    const row = this.getDb()
      .prepare(`SELECT COUNT(*) as total FROM "${collection}" WHERE ${toSqlitePlaceholders(sql)}`)
      .get(...safeParams) as { total: number };
    return row?.total ?? 0;
  }

  async createTable(name: string, schema: TableSchema): Promise<void> {
    const pk = schema.primaryKey ?? "id";
    const columns = [
      `"${pk}" INTEGER PRIMARY KEY AUTOINCREMENT`,
      ...schema.columns.map((col) => {
        const type = sqliteType(col.type, col.length);
        const nullable = col.nullable === false ? " NOT NULL" : "";
        const def = col.default !== undefined ? ` DEFAULT ${JSON.stringify(col.default)}` : "";
        const unique = col.unique ? " UNIQUE" : "";
        return `"${col.name}" ${type}${nullable}${def}${unique}`;
      }),
    ];
    if (schema.timestamps) {
      columns.push('"created_at" TEXT', '"updated_at" TEXT');
    }
    this.getDb().exec(`CREATE TABLE IF NOT EXISTS "${name}" (${columns.join(", ")})`);
    console.log(`[SqliteAdapter] Table "${name}" created`);
  }

  async dropTable(name: string): Promise<void> {
    this.getDb().exec(`DROP TABLE IF EXISTS "${name}"`);
  }

  async tableExists(name: string): Promise<boolean> {
    const row = this.getDb()
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
      .get(name);
    return !!row;
  }

  /** Get existing column names for a table */
  async getTableColumns(tableName: string): Promise<string[]> {
    const rows = this.getDb()
      .prepare(`PRAGMA table_info("${tableName}")`)
      .all() as { name: string }[];
    return rows.map((r) => r.name);
  }

  /** Add a column to an existing table if it doesn't exist */
  async addColumnIfNotExists(
    tableName: string,
    columnName: string,
    type: string,
    options?: { nullable?: boolean; length?: number },
  ): Promise<void> {
    const existing = await this.getTableColumns(tableName);
    if (existing.includes(columnName)) return;
    const nullable = options?.nullable !== false ? "" : " NOT NULL";
    const sqlType = sqliteType(type, options?.length);
    this.getDb().exec(
      `ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${sqlType}${nullable}`,
    );
    console.log(`[SqliteAdapter] Added column "${columnName}" to "${tableName}"`);
  }

  async raw(query: string, params: unknown[] = []): Promise<unknown> {
    const sql = toSqlitePlaceholders(query);
    return this.getDb().prepare(sql).all(...params);
  }
}
