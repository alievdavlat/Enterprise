import { useState, useCallback } from "react";
export function useSort(initialField, initialOrder = "asc") {
    const [sortField, setSortField] = useState(initialField);
    const [sortOrder, setSortOrder] = useState(initialOrder);
    const toggleSort = useCallback((field) => {
        if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        }
        else {
            setSortField(field);
            setSortOrder("asc");
        }
    }, [sortField]);
    return { sortField, sortOrder, toggleSort };
}
//# sourceMappingURL=useSort.js.map