import type {
  Filters,
  PaginationInput,
  PaginationMeta,
  SortInput,
  FindManyParams,
} from "@enterprise/types";

/**
 * Query Builder - Translates Enterprise filter syntax to DB-specific queries
 */
export class QueryBuilder {
  /**
   * Build SQL WHERE clause from Enterprise filters
   */
  buildSqlWhere(
    filters: Filters,
    tableName = "",
  ): { sql: string; params: unknown[] } {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    const prefix = tableName ? `${tableName}.` : "";

    for (const [field, value] of Object.entries(filters)) {
      if (field === "$and" && Array.isArray(value)) {
        const subConditions = value.map((f) => {
          const sub = this.buildSqlWhere(f as Filters, tableName);
          params.push(...sub.params);
          return `(${sub.sql})`;
        });
        conditions.push(subConditions.join(" AND "));
        continue;
      }
      if (field === "$or" && Array.isArray(value)) {
        const subConditions = value.map((f) => {
          const sub = this.buildSqlWhere(f as Filters, tableName);
          params.push(...sub.params);
          return `(${sub.sql})`;
        });
        conditions.push(subConditions.join(" OR "));
        continue;
      }
      if (field === "$not" && typeof value === "object" && value !== null) {
        const sub = this.buildSqlWhere(value as Filters, tableName);
        params.push(...sub.params);
        conditions.push(`NOT (${sub.sql})`);
        continue;
      }

      if (typeof value === "object" && value !== null) {
        const ops = value as Record<string, unknown>;

        if ("$eq" in ops) {
          conditions.push(`${prefix}"${field}" = $${paramIndex++}`);
          params.push(ops.$eq);
        } else if ("$ne" in ops) {
          conditions.push(`${prefix}"${field}" != $${paramIndex++}`);
          params.push(ops.$ne);
        } else if ("$lt" in ops) {
          conditions.push(`${prefix}"${field}" < $${paramIndex++}`);
          params.push(ops.$lt);
        } else if ("$lte" in ops) {
          conditions.push(`${prefix}"${field}" <= $${paramIndex++}`);
          params.push(ops.$lte);
        } else if ("$gt" in ops) {
          conditions.push(`${prefix}"${field}" > $${paramIndex++}`);
          params.push(ops.$gt);
        } else if ("$gte" in ops) {
          conditions.push(`${prefix}"${field}" >= $${paramIndex++}`);
          params.push(ops.$gte);
        } else if ("$in" in ops && Array.isArray(ops.$in)) {
          const placeholders = ops.$in.map(() => `$${paramIndex++}`).join(", ");
          conditions.push(`${prefix}"${field}" IN (${placeholders})`);
          params.push(...(ops.$in as unknown[]));
        } else if ("$notIn" in ops && Array.isArray(ops.$notIn)) {
          const placeholders = ops.$notIn
            .map(() => `$${paramIndex++}`)
            .join(", ");
          conditions.push(`${prefix}"${field}" NOT IN (${placeholders})`);
          params.push(...(ops.$notIn as unknown[]));
        } else if ("$contains" in ops) {
          conditions.push(`${prefix}"${field}" ILIKE $${paramIndex++}`);
          params.push(`%${ops.$contains}%`);
        } else if ("$notContains" in ops) {
          conditions.push(`${prefix}"${field}" NOT ILIKE $${paramIndex++}`);
          params.push(`%${ops.$notContains}%`);
        } else if ("$startsWith" in ops) {
          conditions.push(`${prefix}"${field}" ILIKE $${paramIndex++}`);
          params.push(`${ops.$startsWith}%`);
        } else if ("$endsWith" in ops) {
          conditions.push(`${prefix}"${field}" ILIKE $${paramIndex++}`);
          params.push(`%${ops.$endsWith}`);
        } else if ("$null" in ops) {
          conditions.push(
            ops.$null
              ? `${prefix}"${field}" IS NULL`
              : `${prefix}"${field}" IS NOT NULL`,
          );
        } else if ("$notNull" in ops) {
          conditions.push(
            ops.$notNull
              ? `${prefix}"${field}" IS NOT NULL`
              : `${prefix}"${field}" IS NULL`,
          );
        } else if ("$between" in ops && Array.isArray(ops.$between)) {
          conditions.push(
            `${prefix}"${field}" BETWEEN $${paramIndex++} AND $${paramIndex++}`,
          );
          params.push(ops.$between[0], ops.$between[1]);
        }
      } else {
        conditions.push(`${prefix}"${field}" = $${paramIndex++}`);
        params.push(value);
      }
    }

    return {
      sql: conditions.length > 0 ? conditions.join(" AND ") : "1=1",
      params,
    };
  }

  /**
   * Build MongoDB filter from Enterprise filters
   */
  buildMongoFilter(filters: Filters): Record<string, unknown> {
    const mongoQuery: Record<string, unknown> = {};

    for (const [field, value] of Object.entries(filters)) {
      if (field === "$and" && Array.isArray(value)) {
        mongoQuery.$and = value.map((f) => this.buildMongoFilter(f as Filters));
        continue;
      }
      if (field === "$or" && Array.isArray(value)) {
        mongoQuery.$or = value.map((f) => this.buildMongoFilter(f as Filters));
        continue;
      }
      if (field === "$not" && typeof value === "object") {
        mongoQuery.$nor = [this.buildMongoFilter(value as Filters)];
        continue;
      }

      if (typeof value === "object" && value !== null) {
        const ops = value as Record<string, unknown>;
        const mongoOps: Record<string, unknown> = {};

        if ("$eq" in ops) mongoOps.$eq = ops.$eq;
        if ("$ne" in ops) mongoOps.$ne = ops.$ne;
        if ("$lt" in ops) mongoOps.$lt = ops.$lt;
        if ("$lte" in ops) mongoOps.$lte = ops.$lte;
        if ("$gt" in ops) mongoOps.$gt = ops.$gt;
        if ("$gte" in ops) mongoOps.$gte = ops.$gte;
        if ("$in" in ops) mongoOps.$in = ops.$in;
        if ("$notIn" in ops) mongoOps.$nin = ops.$notIn;
        if ("$contains" in ops)
          mongoOps.$regex = new RegExp(ops.$contains as string, "i");
        if ("$startsWith" in ops)
          mongoOps.$regex = new RegExp(`^${ops.$startsWith}`, "i");
        if ("$endsWith" in ops)
          mongoOps.$regex = new RegExp(`${ops.$endsWith}$`, "i");
        if ("$null" in ops) mongoOps.$exists = !ops.$null;
        if ("$between" in ops && Array.isArray(ops.$between)) {
          mongoOps.$gte = ops.$between[0];
          mongoOps.$lte = ops.$between[1];
        }

        mongoQuery[field] = mongoOps;
      } else {
        mongoQuery[field] = value;
      }
    }

    return mongoQuery;
  }

  /**
   * Parse and calculate pagination
   */
  parsePagination(
    input: PaginationInput = {},
  ): PaginationMeta & { offset: number; limit: number } {
    const pageSize = Math.min(input.pageSize || input.limit || 25, 200);
    const page = Math.max(input.page || 1, 1);
    const start =
      input.start !== undefined ? input.start : (page - 1) * pageSize;

    return {
      page,
      pageSize,
      pageCount: 0, // Will be updated after count query
      total: 0, // Will be updated after count query
      offset: start,
      limit: pageSize,
    };
  }

  /**
   * Build ORDER BY clause
   */
  buildSqlOrderBy(sort?: SortInput | SortInput[] | string): string {
    if (!sort) return "";

    if (typeof sort === "string") {
      const parts = sort.split(":");
      return `ORDER BY "${parts[0]}" ${parts[1] === "desc" ? "DESC" : "ASC"}`;
    }

    const sorts = Array.isArray(sort) ? sort : [sort];
    const orderParts = sorts.map(
      (s) => `"${s.field}" ${s.direction === "desc" ? "DESC" : "ASC"}`,
    );
    return `ORDER BY ${orderParts.join(", ")}`;
  }
}
