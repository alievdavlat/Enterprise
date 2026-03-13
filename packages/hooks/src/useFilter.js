import { useState, useCallback } from "react";
export function useFilter(initialFilters = []) {
    const [filters, setFilters] = useState(initialFilters);
    const addFilter = useCallback((filter) => {
        setFilters((prev) => {
            const exists = prev.find((f) => f.field === filter.field);
            if (exists)
                return prev.map((f) => (f.field === filter.field ? filter : f));
            return [...prev, filter];
        });
    }, []);
    const removeFilter = useCallback((field) => {
        setFilters((prev) => prev.filter((f) => f.field !== field));
    }, []);
    const updateFilter = useCallback((field, partial) => {
        setFilters((prev) => prev.map((f) => (f.field === field ? { ...f, ...partial } : f)));
    }, []);
    const clearFilters = useCallback(() => setFilters([]), []);
    const toQueryString = useCallback(() => {
        const params = {};
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
//# sourceMappingURL=useFilter.js.map