import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@enterprise/design-system";
import type { MediaFile } from "@/types";

export interface SortOption {
  value: string;
  label: string;
}

export interface MediaFilterBarProps {
  list: MediaFile[];
  selectedIds: Set<number>;
  toggleSelectAll: () => void;
  sort: string;
  setSortAndSave: (value: string | null) => void;
  SORT_OPTIONS: readonly SortOption[];
}

export const MediaFilterBar = ({
  list,
  selectedIds,
  toggleSelectAll,
  sort,
  setSortAndSave,
  SORT_OPTIONS,
}: MediaFilterBarProps) => {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={list.length > 0 && selectedIds.size === list.length}
          onChange={toggleSelectAll}
          className="rounded border-input"
        />
        <Select value={sort} onValueChange={setSortAndSave}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
