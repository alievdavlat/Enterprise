import { useState, useCallback } from "react";

export function useSort(
  initialField?: string,
  initialOrder: "asc" | "desc" = "asc",
) {
  const [sortField, setSortField] = useState<string | undefined>(initialField);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(initialOrder);

  const toggleSort = useCallback(
    (field: string) => {
      if (sortField === field) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortOrder("asc");
      }
    },
    [sortField],
  );

  return { sortField, sortOrder, toggleSort };
}
