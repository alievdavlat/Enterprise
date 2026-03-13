export interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { pagination: PaginationMeta };
}

export function buildPaginationQuery(
  page: number,
  pageSize: number,
): Record<string, string> {
  return {
    "pagination[page]": String(page),
    "pagination[pageSize]": String(pageSize),
  };
}

export function calculatePagination(
  total: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  return {
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize) || 1,
    total,
  };
}
