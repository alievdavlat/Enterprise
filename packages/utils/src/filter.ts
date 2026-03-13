export function buildFilterQuery(
  filters: Record<string, { operator: string; value: unknown }>,
): Record<string, unknown> {
  const query: Record<string, unknown> = {};
  for (const [field, { operator, value }] of Object.entries(filters)) {
    query[`filters[${field}][$${operator}]`] = value;
  }
  return query;
}
