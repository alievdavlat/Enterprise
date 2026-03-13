export type FilterOperator = "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | "in" | "notIn" | "contains" | "notContains" | "startsWith" | "endsWith" | "null" | "notNull" | "between";
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
export declare function useFilter(initialFilters?: FilterValue[]): FilterResult;
//# sourceMappingURL=useFilter.d.ts.map