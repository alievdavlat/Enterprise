import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PAGE_SIZE_OPTIONS } from "@/consts";

const defaultPageSize = 24;
const defaultSort = "created_at:desc";

export type MediaViewMode = "grid" | "list";

interface MediaPreferencesState {
  viewMode: MediaViewMode;
  pageSize: number;
  sort: string;
  setViewMode: (mode: MediaViewMode) => void;
  setPageSize: (n: number) => void;
  setSort: (s: string) => void;
}

export const useMediaPreferencesStore = create<MediaPreferencesState>()(
  persist(
    (set) => ({
      viewMode: "grid",
      pageSize: defaultPageSize,
      sort: defaultSort,
      setViewMode: (viewMode) => set({ viewMode }),
      setPageSize: (pageSize) =>
        set({
          pageSize: PAGE_SIZE_OPTIONS.includes(pageSize as (typeof PAGE_SIZE_OPTIONS)[number])
            ? pageSize
            : defaultPageSize,
        }),
      setSort: (sort) => set({ sort: sort || defaultSort }),
    }),
    {
      name: "enterprise-media-preferences",
      partialize: (s) => ({
        viewMode: s.viewMode,
        pageSize: s.pageSize,
        sort: s.sort,
      }),
    },
  ),
);
