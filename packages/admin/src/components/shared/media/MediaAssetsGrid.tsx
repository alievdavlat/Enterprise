"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button, Card, CardContent } from "@enterprise/design-system";
import { Image as ImageIcon } from "lucide-react";
import type { MediaFile } from "@/types";
import { getImageUrl, isImageMime, formatFileSize } from "@/utils";

export interface MediaAssetsGridProps {
  list: MediaFile[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onEdit: (file: MediaFile) => void;
  onRemove: (id: number) => void;
}

export function MediaAssetsGrid({
  list,
  selectedIds,
  onToggleSelect,
  onEdit,
  onRemove,
}: MediaAssetsGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {list.map((file) => (
        <Card
          key={file.id}
          className="border-border/50 overflow-hidden group"
        >
          <div className="aspect-[4/3] bg-muted relative">
            <input
              type="checkbox"
              checked={selectedIds.has(file.id)}
              onChange={() => onToggleSelect(file.id)}
              className="absolute top-2 left-2 z-10 rounded bg-background/80"
            />
            {isImageMime(file.mime ?? "") ? (
              <img
                src={getImageUrl(file.url)}
                alt={file.alternativeText ?? file.name}
                className="w-full h-full max-h-[12rem] min-w-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8"
                onClick={() => onEdit(file)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="danger"
                className="h-8 w-8"
                onClick={() => onRemove(file.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <CardContent className="p-2">
            <p className="text-xs font-medium truncate" title={file.name}>
              {file.name}
            </p>
            {file.size != null && (
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
