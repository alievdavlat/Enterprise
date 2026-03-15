"use client";

import { Upload } from "lucide-react";
import { Button, Card, CardContent } from "@enterprise/design-system";
import { Image as ImageIcon } from "lucide-react";
import { FileImage } from "lucide-react";
import type { MediaFile } from "@/types";
import { MediaAssetsGrid } from "./MediaAssetsGrid";
import { MediaAssetsList } from "./MediaAssetsList";

export type MediaViewMode = "grid" | "list";

export interface MediaAssetsSectionProps {
  list: MediaFile[];
  total: number;
  loading: boolean;
  viewMode: MediaViewMode;
  selectedIds: Set<number>;
  page: number;
  pageCount: number;
  pageSize: number;
  onToggleSelect: (id: number) => void;
  onEdit: (file: MediaFile) => void;
  onRemove: (id: number) => void;
  onPagePrev: () => void;
  onPageNext: () => void;
  onAddAssetsClick: () => void;
  uploading: boolean;
}

export function MediaAssetsSection({
  list,
  total,
  loading,
  viewMode,
  selectedIds,
  page,
  pageCount,
  onToggleSelect,
  onEdit,
  onRemove,
  onPagePrev,
  onPageNext,
  onAddAssetsClick,
  uploading,
}: MediaAssetsSectionProps) {
  const pagination = (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Page {page} of {pageCount} ({total} assets)
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={onPagePrev}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pageCount}
          onClick={onPageNext}
        >
          Next
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <FileImage className="w-4 h-4 text-rose-500" />
        Assets ({total})
      </h3>

      {loading ? (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading…
            </div>
          </CardContent>
        </Card>
      ) : list.length === 0 ? (
        <Card className="border-border/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-24 px-6">
            <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center mb-4">
              <ImageIcon className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium mb-1">No assets yet</p>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
              Upload images, videos or documents to use in your content.
            </p>
            <Button
              className="gap-2"
              onClick={onAddAssetsClick}
              disabled={uploading}
            >
              <Upload className="w-4 h-4" />
              Add new assets
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "list" ? (
        <>
          <Card className="border-border/50 overflow-hidden">
            <MediaAssetsList
              list={list}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              onEdit={onEdit}
              onRemove={onRemove}
            />
          </Card>
          {pageCount > 1 && pagination}
        </>
      ) : (
        <>
          <MediaAssetsGrid
            list={list}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onEdit={onEdit}
            onRemove={onRemove}
          />
          {pageCount > 1 && pagination}
        </>
      )}
    </div>
  );
}
