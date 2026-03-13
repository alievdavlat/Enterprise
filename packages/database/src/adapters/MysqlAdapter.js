import mysql from "mysql2/promise";
import { QueryBuilder } from "@enterprise/core";
export class MysqlAdapter {
    constructor(config) {
        this.pool = null;
        this.queryBuilder = new QueryBuilder();
        this._isConnected = false;
        this.config = config;
    }
    async connect() {
        this.pool = mysql.createPool({
            host: this.config.host || "localhost",
            port: this.config.port || 3306,
            database: this.config.database,
            user: this.config.username,
            password: this.config.password,
            uri: this.config.uri,
            ssl: this.config.ssl ? {} : undefined,
            connectionLimit: this.config.pool?.max || 10,
            waitForConnections: true,
        });
        // Test connection
        const conn = await this.pool.getConnection();
        conn.release();
        this._isConnected = true;
        console.log("[MysqlAdapter] Connected to MySQL database");
    }
    async disconnect() {
        if (this.pool) {
            await this.pool.end();
            this._isConnected = false;
            console.log("[MysqlAdapter] Disconnected from MySQL");
        }
    }
    isConnected() {
        return this._isConnected;
    }
    buildMysqlWhere(filters) {
        const conditions = [];
        const params = [];
        for (const [field, value] of Object.entries(filters)) {
            if (typeof value === "object" && value !== null) {
                const ops = value;
                if ("$eq" in ops) {
                    conditions.push(`\`${field}\` = ?`);
                    params.push(ops.$eq);
                }
                else if ("$ne" in ops) {
                    conditions.push(`\`${field}\` != ?`);
                    params.push(ops.$ne);
                }
                else if ("$lt" in ops) {
                    conditions.push(`\`${field}\` < ?`);
                    params.push(ops.$lt);
                }
                else if ("$lte" in ops) {
                    conditions.push(`\`${field}\` <= ?`);
                    params.push(ops.$lte);
                }
                else if ("$gt" in ops) {
                    conditions.push(`\`${field}\` > ?`);
                    params.push(ops.$gt);
                }
                else if ("$gte" in ops) {
                    conditions.push(`\`${field}\` >= ?`);
                    params.push(ops.$gte);
                }
                else if ("$in" in ops && Array.isArray(ops.$in)) {
                    conditions.push(`\`${field}\` IN (?)`);
                    params.push(ops.$in);
                }
                else if ("$contains" in ops) {
                    conditions.push(`\`${field}\` LIKE ?`);
                    params.push(`%${ops.$contains}%`);
                }
                else if ("$startsWith" in ops) {
                    conditions.push(`\`${field}\` LIKE ?`);
                    params.push(`${ops.$startsWith}%`);
                }
                else if ("$null" in ops) {
                    conditions.push(ops.$null ? `\`${field}\` IS NULL` : `\`${field}\` IS NOT NULL`);
                }
            }
            else {
                conditions.push(`\`${field}\` = ?`);
                params.push(value);
            }
        }
        return {
            sql: conditions.length > 0 ? conditions.join(" AND ") : "1=1",
            params,
        };
    }
    async findMany(collection, params = {}) {
        const { filters = {}, sort, pagination } = params;
        const pag = this.queryBuilder.parsePagination(pagination);
        const where = this.buildMysqlWhere(filters);
        let orderBy = "";
        if (sort && typeof sort === "string") {
            const [field, dir] = sort.split(":");
            orderBy = `ORDER BY \`${field}\` ${dir === "desc" ? "DESC" : "ASC"}`;
        }
        else if (sort && typeof sort === "object" && !Array.isArray(sort)) {
            const s = sort;
            orderBy = `ORDER BY \`${s.field}\` ${s.direction === "desc" ? "DESC" : "ASC"}`;
        }
        const dataSql = `SELECT * FROM \`${collection}\` WHERE ${where.sql} ${orderBy} LIMIT ? OFFSET ?`;
        const countSql = `SELECT COUNT(*) as total FROM \`${collection}\` WHERE ${where.sql}`;
        const [dataRows] = await this.pool.query(dataSql, [
            ...where.params,
            pag.limit,
            pag.offset,
        ]);
        const [countRows] = await this.pool.query(countSql, where.params);
        const total = parseInt(countRows[0]?.total || "0", 10);
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
    async findOne(collection, id) {
        const [rows] = await this.pool.query(`SELECT * FROM \`${collection}\` WHERE id = ? LIMIT 1`, [id]);
        return rows[0] || null;
    }
    async findOneBy(collection, where) {
        const { sql, params } = this.buildMysqlWhere(where);
        const [rows] = await this.pool.query(`SELECT * FROM \`${collection}\` WHERE ${sql} LIMIT 1`, params);
        return rows[0] || null;
    }
    async create(collection, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const columns = keys.map((k) => `\`${k}\``).join(", ");
        const placeholders = keys.map(() => "?").join(", ");
        const [result] = await this.pool.query(`INSERT INTO \`${collection}\` (${columns}, created_at, updated_at) VALUES (${placeholders}, NOW(), NOW())`, values);
        const insertId = result.insertId;
        return this.findOne(collection, insertId);
    }
    async update(collection, id, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClauses = keys.map((k) => `\`${k}\` = ?`).join(", ");
        await this.pool.query(`UPDATE \`${collection}\` SET ${setClauses}, updated_at = NOW() WHERE id = ?`, [...values, id]);
        return this.findOne(collection, id);
    }
    async delete(collection, id) {
        const existing = await this.findOne(collection, id);
        if (!existing)
            throw new Error(`Record not found: ${id}`);
        await this.pool.query(`DELETE FROM \`${collection}\` WHERE id = ?`, [id]);
        return existing;
    }
    async count(collection, filters = {}) {
        const { sql, params } = this.buildMysqlWhere(filters);
        const [rows] = await this.pool.query(`SELECT COUNT(*) as total FROM \`${collection}\` WHERE ${sql}`, params);
        return parseInt(rows[0]?.total || "0", 10);
    }
    async createTable(name, schema) {
        const pk = schema.primaryKey || "id";
        const columns = [
            `\`${pk}\` INT AUTO_INCREMENT PRIMARY KEY`,
            ...schema.columns.map((col) => {
                const type = this.mysqlType(col.type, col.length);
                const nullable = col.nullable === false ? " NOT NULL" : "";
                const def = col.default !== undefined
                    ? ` DEFAULT ${JSON.stringify(col.default)}`
                    : "";
                const unique = col.unique ? " UNIQUE" : "";
                return `\`${col.name}\` ${type}${nullable}${def}${unique}`;
            }),
        ];
        if (schema.timestamps) {
            columns.push("`created_at` DATETIME DEFAULT NOW()", "`updated_at` DATETIME DEFAULT NOW() ON UPDATE NOW()");
        }
        await this.pool.query(`CREATE TABLE IF NOT EXISTS \`${name}\` (${columns.join(", ")})`);
        console.log(`[MysqlAdapter] Table "${name}" created`);
    }
    async dropTable(name) {
        await this.pool.query(`DROP TABLE IF EXISTS \`${name}\``);
    }
    async tableExists(name) {
        const [rows] = await this.pool.query(`SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`, [this.config.database, name]);
        return rows.length > 0;
    }
    async raw(query, params = []) {
        const [result] = await this.pool.query(query, params);
        return result;
    }
    mysqlType(type, length) {
        const map = {
            string: `VARCHAR(${length || 255})`,
            text: "TEXT",
            integer: "INT",
            bigint: "BIGINT",
            float: "FLOAT",
            decimal: "DECIMAL(10,2)",
            boolean: "TINYINT(1)",
            date: "DATE",
            datetime: "DATETIME",
            json: "JSON",
            uuid: "CHAR(36)",
        };
        return map[type] || "TEXT";
    }
}
//# sourceMappingURL=MysqlAdapter.js.map