export const MEDIA_VIEW_KEY = "enterprise-media-view";
export const MEDIA_PAGE_SIZE_KEY = "enterprise-media-page-size";
export const MEDIA_SORT_KEY = "enterprise-media-sort";

export const PAGE_SIZE_OPTIONS = [10, 24, 50, 100] as const;

export const SORT_OPTIONS = [
  { value: "created_at:desc", label: "Most recent uploads" },
  { value: "created_at:asc", label: "Oldest uploads" },
  { value: "name:asc", label: "Alphabetical (A–Z)" },
  { value: "name:desc", label: "Alphabetical (Z–A)" },
  { value: "size:desc", label: "Size (largest first)" },
  { value: "size:asc", label: "Size (smallest first)" },
] as const;
