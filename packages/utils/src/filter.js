export function buildFilterQuery(filters) {
    const query = {};
    for (const [field, { operator, value }] of Object.entries(filters)) {
        query[`filters[${field}][$${operator}]`] = value;
    }
    return query;
}
//# sourceMappingURL=filter.js.map