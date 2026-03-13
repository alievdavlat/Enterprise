import { useState, useCallback, useMemo } from "react";

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

export function usePagination(
  options: PaginationOptions = {},
): PaginationResult {
  const {
    initialPage = 1,
    initialPageSize = 10,
    total: initialTotal = 0,
  } = options;
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [total, setTotal] = useState(initialTotal);

  const totalPages = useMemo(
    () => Math.ceil(total / pageSize) || 1,
    [total, pageSize],
  );
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const nextPage = useCallback(
    () => setPage((p) => Math.min(p + 1, totalPages)),
    [totalPages],
  );
  const prevPage = useCallback(() => setPage((p) => Math.max(p - 1, 1)), []);
  const goToFirst = useCallback(() => setPage(1), []);
  const goToLast = useCallback(() => setPage(totalPages), [totalPages]);

  const handleSetPageSize = useCallback((size: number) => {
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
