import { useState, useCallback, useMemo } from "react";
export function usePagination(options = {}) {
    const { initialPage = 1, initialPageSize = 10, total: initialTotal = 0, } = options;
    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [total, setTotal] = useState(initialTotal);
    const totalPages = useMemo(() => Math.ceil(total / pageSize) || 1, [total, pageSize]);
    const hasPrev = page > 1;
    const hasNext = page < totalPages;
    const nextPage = useCallback(() => setPage((p) => Math.min(p + 1, totalPages)), [totalPages]);
    const prevPage = useCallback(() => setPage((p) => Math.max(p - 1, 1)), []);
    const goToFirst = useCallback(() => setPage(1), []);
    const goToLast = useCallback(() => setPage(totalPages), [totalPages]);
    const handleSetPageSize = useCallback((size) => {
        setPageSize(size);
        setPage(1);
    }, []);
    return {
        page,
        pageSize,
        total,
        totalPages,
        hasPrev,
        hasNext,
        setPage,
        setPageSize: handleSetPageSize,
        nextPage,
        prevPage,
        goToFirst,
        goToLast,
    };
}
//# sourceMappingURL=usePagination.js.map