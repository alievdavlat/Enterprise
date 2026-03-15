"use client";

import { Pencil, Trash2 } from "lucide-react";
import {
  Button,
  TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@enterprise/design-system";
import { Image as ImageIcon } from "lucide-react";
import type { MediaFile } from "@/types";
import { getImageUrl, isImageMime, formatFileSize } from "@/utils";

export interface MediaAssetsListProps {
  list: MediaFile[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onEdit: (file: MediaFile) => void;
  onRemove: (id: number) => void;
}

export function MediaAssetsList({
  list,
  selectedIds,
  onToggleSelect,
  onEdit,
  onRemove,
}: MediaAssetsListProps) {
  return (
    <TableRoot>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-12">Preview</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Alternative text</TableHead>
          <TableHead>Caption</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-[100px] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {list.map((file) => (
          <TableRow key={file.id} className="group">
            <TableCell className="p-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedIds.has(file.id)}
                  onChange={() => onToggleSelect(file.id)}
                  className="rounded shrink-0"
                />
                <div className="w-12 h-12 rounded overflow-hidden bg-muted flex items-center justify-center shrink-0">
                  {isImageMime(file.mime ?? "") ? (
                    <img
                      src={getImageUrl(file.url)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell
              className="font-medium max-w-[200px] truncate"
              title={file.name}
            >
              {file.name}
            </TableCell>
            <TableCell className="text-muted-foreground max-w-[150px] truncate">
              {file.alternativeText ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground max-w-[150px] truncate">
              {file.caption ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {file.size != null ? formatFileSize(file.size) : "—"}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {file.createdAt
                ? new Date(file.createdAt).toLocaleDateString()
                : "—"}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => onEdit(file)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onRemove(file.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableRoot>
  );
}
