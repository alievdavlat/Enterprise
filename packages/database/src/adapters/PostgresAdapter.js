import { Pool } from "pg";
import { QueryBuilder } from "@enterprise/core";
export class PostgresAdapter {
    constructor(config) {
        this.pool = null;
        this.queryBuilder = new QueryBuilder();
        this._isConnected = false;
        this.config = config;
    }
    async connect() {
        this.pool = new Pool({
            host: this.config.host || "localhost",
            port: this.config.port || 5432,
            database: this.config.database,
            user: this.config.username,
            password: this.config.password,
            connectionString: this.config.uri,
            ssl: this.config.ssl ? { rejectUnauthorized: false } : undefined,
            min: this.config.pool?.min || 2,
            max: this.config.pool?.max || 10,
        });
        // Test connection
        const client = await this.pool.connect();
        client.release();
        this._isConnected = true;
        console.log("[PostgresAdapter] Connected to PostgreSQL database");
    }
    async disconnect() {
        if (this.pool) {
            await this.pool.end();
            this._isConnected = false;
            console.log("[PostgresAdapter] Disconnected from PostgreSQL");
        }
    }
    isConnected() {
        return this._isConnected;
    }
    async getClient() {
        if (!this.pool)
            throw new Error("Not connected to PostgreSQL");
        return this.pool.connect();
    }
    async findMany(collection, params = {}) {
        const client = await this.getClient();
        try {
            const { filters = {}, sort, pagination } = params;
            const pag = this.queryBuilder.parsePagination(pagination);
            const where = this.queryBuilder.buildSqlWhere(filters, collection);
            const orderBy = this.queryBuilder.buildSqlOrderBy(sort);
            let paramOffset = where.params.length;
            const limitClause = `LIMIT $${++paramOffset} OFFSET $${++paramOffset}`;
            const dataSql = `SELECT * FROM "${collection}" WHERE ${where.sql} ${orderBy} ${limitClause}`;
            const countSql = `SELECT COUNT(*) as total FROM "${collection}" WHERE ${where.sql}`;
            const [dataResult, countResult] = await Promise.all([
                client.query(dataSql, [...where.params, pag.limit, pag.offset]),
                client.query(countSql, where.params),
            ]);
            const total = parseInt(countResult.rows[0]?.total || "0", 10);
            const pageCount = Math.ceil(total / pag.pageSize);
            return {
                data: dataResult.rows,
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
        finally {
            client.release();
        }
    }
    async findOne(collection, id) {
        const client = await this.getClient();
        try {
            const result = await client.query(`SELECT * FROM "${collection}" WHERE id = $1 LIMIT 1`, [id]);
            return result.rows[0] || null;
        }
        finally {
            client.release();
        }
    }
    async findOneBy(collection, where) {
        const client = await this.getClient();
        try {
            const { sql, params } = this.queryBuilder.buildSqlWhere(where);
            const result = await client.query(`SELECT * FROM "${collection}" WHERE ${sql} LIMIT 1`, params);
            return result.rows[0] || null;
        }
        finally {
            client.release();
        }
    }
    async create(collection, data) {
        const client = await this.getClient();
        try {
            const keys = Object.keys(data);
            const values = Object.values(data);
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
            const columns = keys.map((k) => `"${k}"`).join(", ");
            const result = await client.query(`INSERT INTO "${collection}" (${columns}, created_at, updated_at) VALUES (${placeholders}, NOW(), NOW()) RETURNING *`, values);
            return result.rows[0];
        }
        finally {
            client.release();
        }
    }
    async update(collection, id, data) {
        const client = await this.getClient();
        try {
            const keys = Object.keys(data);
            const values = Object.values(data);
            const setClauses = keys.map((k, i) => `"${k}" = $${i + 1}`).join(", ");
            const result = await client.query(`UPDATE "${collection}" SET ${setClauses}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`, [...values, id]);
            if (!result.rows[0])
                throw new Error(`Record not found: ${id}`);
            return result.rows[0];
        }
        finally {
            client.release();
        }
    }
    async delete(collection, id) {
        const client = await this.getClient();
        try {
            const result = await client.query(`DELETE FROM "${collection}" WHERE id = $1 RETURNING *`, [id]);
            if (!result.rows[0])
                throw new Error(`Record not found: ${id}`);
            return result.rows[0];
        }
        finally {
            client.release();
        }
    }
    async count(collection, filters = {}) {
        const client = await this.getClient();
        try {
            const { sql, params } = this.queryBuilder.buildSqlWhere(filters);
            const result = await client.query(`SELECT COUNT(*) as total FROM "${collection}" WHERE ${sql}`, params);
            return parseInt(result.rows[0]?.total || "0", 10);
        }
        finally {
            client.release();
        }
    }
    async createTable(name, schema) {
        const client = await this.getClient();
        try {
            const pk = schema.primaryKey || "id";
            const columns = [
                `"${pk}" SERIAL PRIMARY KEY`,
                ...schema.columns.map((col) => {
                    const type = this.pgType(col.type, col.length);
                    const nullable = col.nullable === false ? " NOT NULL" : "";
                    const def = col.default !== undefined
                        ? ` DEFAULT ${JSON.stringify(col.default)}`
                        : "";
                    const unique = col.unique ? " UNIQUE" : "";
                    return `"${col.name}" ${type}${nullable}${def}${unique}`;
                }),
            ];
            if (schema.timestamps) {
                columns.push('"created_at" TIMESTAMP DEFAULT NOW()', '"updated_at" TIMESTAMP DEFAULT NOW()');
            }
            await client.query(`CREATE TABLE IF NOT EXISTS "${name}" (${columns.join(", ")})`);
            console.log(`[PostgresAdapter] Table "${name}" created`);
        }
        finally {
            client.release();
        }
    }
    async dropTable(name) {
        const client = await this.getClient();
        try {
            await client.query(`DROP TABLE IF EXISTS "${name}"`);
        }
        finally {
            client.release();
        }
    }
    async tableExists(name) {
        const client = await this.getClient();
        try {
            const result = await client.query(`SELECT to_regclass($1) as exists`, [
                `public.${name}`,
            ]);
            return result.rows[0]?.exists !== null;
        }
        finally {
            client.release();
        }
    }
    async raw(query, params = []) {
        const client = await this.getClient();
        try {
            const result = await client.query(query, params);
            return result;
        }
        finally {
            client.release();
        }
    }
    pgType(type, length) {
        const map = {
            string: `VARCHAR(${length || 255})`,
            text: "TEXT",
            integer: "INTEGER",
            bigint: "BIGINT",
            float: "FLOAT",
            decimal: "DECIMAL",
            boolean: "BOOLEAN",
            date: "DATE",
            datetime: "TIMESTAMP",
            json: "JSONB",
            uuid: "UUID",
        };
        return map[type] || "TEXT";
    }
}
//# sourceMappingURL=PostgresAdapter.js.map