import type { Filters, PaginationInput, PaginationMeta, SortInput } from "@enterprise/types";
/**
 * Query Builder - Translates Enterprise filter syntax to DB-specific queries
 */
export declare class QueryBuilder {
    /**
     * Build SQL WHERE clause from Enterprise filters
     */
    buildSqlWhere(filters: Filters, tableName?: string): {
        sql: string;
        params: unknown[];
    };
    /**
     * Build MongoDB filter from Enterprise filters
     */
    buildMongoFilter(filters: Filters): Record<string, unknown>;
    /**
     * Parse and calculate pagination
     */
    parsePagination(input?: PaginationInput): PaginationMeta & {
        offset: number;
        limit: number;
    };
    /**
     * Build ORDER BY clause
     */
    buildSqlOrderBy(sort?: SortInput | SortInput[] | string): string;
}
//# sourceMappingURL=QueryBuilder.d.ts.map