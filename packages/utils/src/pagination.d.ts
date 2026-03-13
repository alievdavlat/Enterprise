export interface PaginationMeta {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
}
export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        pagination: PaginationMeta;
    };
}
export declare function buildPaginationQuery(page: number, pageSize: number): Record<string, string>;
export declare function calculatePagination(total: number, page: number, pageSize: number): PaginationMeta;
//# sourceMappingURL=pagination.d.ts.map