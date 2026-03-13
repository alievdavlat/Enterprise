export interface PaginationOptions {
    initialPage?: number;
    initialPageSize?: number;
    total?: number;
}
export interface PaginationResult {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasPrev: boolean;
    hasNext: boolean;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    goToFirst: () => void;
    goToLast: () => void;
}
export declare function usePagination(options?: PaginationOptions): PaginationResult;
//# sourceMappingURL=usePagination.d.ts.map