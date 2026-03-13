import { useState, useCallback } from "react";

export type FilterOperator =
  | "eq"
  | "ne"
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "in"
  | "notIn"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "null"
  | "notNull"
  | "between";

export interface FilterValue {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | null | (string | number)[];
}

export interface FilterResult {
  filters: FilterValue[];
  addFilter: (filter: FilterValue) => void;
  removeFilter: (field: string) => void;
  updateFilter: (field: string, filter: Partial<FilterValue>) => void;
  clearFilters: () => void;
  toQueryString: () => Record<string, unknown>;
}

export function useFilter(initialFilters: FilterValue[] = []): FilterResult {
  const [filters, setFilters] = useState<FilterValue[]>(initialFilters);

  const addFilter = useCallback((filter: FilterValue) => {
    setFilters((prev) => {
      const exists = prev.find((f) => f.field === filter.field);
      if (exists)
        return prev.map((f) => (f.field === filter.field ? filter : f));
      return [...prev, filter];
    });
  }, []);

  const removeFilter = useCallback((field: string) => {
    setFilters((prev) => prev.filter((f) => f.field !== field));
  }, []);

  const updateFilter = useCallback(
    (field: string, partial: Partial<FilterValue>) => {
      setFilters((prev) =>
        prev.map((f) => (f.field === field ? { ...f, ...partial } : f)),
      );
    },
    [],
  );

  const clearFilters = useCallback(() => setFilters([]), []);

  const toQueryString = useCallback(() => {
    const params: Record<string, unknown> = {};
    filters.forEach((f) => {
      params[`filters[${f.field}][$${f.operator}]`] = f.value;
    });
    return params;
  }, [filters]);

  return {
    filters,
    addFilter,
    removeFilter,
    updateFilter,
    clearFilters,
    toQueryString,
  };
}
