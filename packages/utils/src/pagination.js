export function buildPaginationQuery(page, pageSize) {
    return {
        "pagination[page]": String(page),
        "pagination[pageSize]": String(pageSize),
    };
}
export function calculatePagination(total, page, pageSize) {
    return {
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize) || 1,
        total,
    };
}
//# sourceMappingURL=pagination.js.map