export interface MediaFile {
  id: number;
  name: string;
  url: string;
  mime?: string;
  size?: number;
  caption?: string | null;
  alternativeText?: string | null;
  folderPath?: string | null;
  createdAt?: string;
}

export interface MediaFolder {
  id: number;
  name: string;
  path: string;
  parentPath?: string | null;
}

export function normalizeMediaFile(row: Record<string, unknown>): MediaFile {
  return {
    id: Number(row.id),
    name: String(row.name ?? ""),
    url: String(row.url ?? ""),
    mime: row.mime != null ? String(row.mime) : undefined,
    size: row.size != null ? Number(row.size) : undefined,
    caption: row.caption != null ? String(row.caption) : null,
    alternativeText:
      row.alternativeText != null ? String(row.alternativeText) : null,
    folderPath: row.folderPath != null ? String(row.folderPath) : null,
    createdAt:
      row.created_at != null
        ? String(row.created_at)
        : row.createdAt != null
          ? String(row.createdAt)
          : undefined,
  };
}
