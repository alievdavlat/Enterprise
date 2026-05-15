"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@enterprise/design-system";
import type { MediaFile } from "@/types";
import { getImageUrl, isImageMime, formatFileSize } from "@/utils";
import { cn } from "@/lib/utils";

export interface MediaAssetsPhoneGalleryProps {
  list: MediaFile[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onEdit: (file: MediaFile) => void;
  onRemove: (id: number) => void;
}

/**
 * iPhone / Samsung Photos-style gallery view.
 *
 * Differences vs the card grid:
 *   - Edge-to-edge square tiles, no card chrome
 *   - Photos are grouped by upload month (sticky-style section headers)
 *   - Tap a tile → fullscreen viewer with prev/next + keyboard nav
 *   - Long-press / cmd-click style selection: a check chip in the corner
 *
 * Looks like the native Photos UX so users with no CMS muscle memory
 * immediately know how to browse + zoom into media.
 */
export function MediaAssetsPhoneGallery({
  list,
  selectedIds,
  onToggleSelect,
  onEdit,
  onRemove,
}: MediaAssetsPhoneGalleryProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // Group items by year-month based on createdAt (fallback to "Other").
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; items: MediaFile[] }>();
    const formatter = new Intl.DateTimeFormat(undefined, {
      month: "long",
      year: "numeric",
    });
    for (const file of list) {
      const ts = file.createdAt ?? null;
      let label = "Other";
      let key = "other";
      if (ts) {
        const d = new Date(ts);
        if (!Number.isNaN(d.getTime())) {
          label = formatter.format(d);
          key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        }
      }
      const existing = map.get(key) ?? { label, items: [] };
      existing.items.push(file);
      map.set(key, existing);
    }
    // Sort newest-first (year-month keys sort naturally, "other" last).
    return Array.from(map.entries())
      .sort((a, b) => {
        if (a[0] === "other") return 1;
        if (b[0] === "other") return -1;
        return b[0].localeCompare(a[0]);
      })
      .map(([key, g]) => ({ key, ...g }));
  }, [list]);

  // Flat list mirrors visual order so the viewer's prev/next match what
  // the user sees on screen.
  const flatList = useMemo(
    () => groups.flatMap((g) => g.items),
    [groups],
  );

  useEffect(() => {
    if (viewerIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewerIndex(null);
      else if (e.key === "ArrowLeft" && viewerIndex > 0)
        setViewerIndex(viewerIndex - 1);
      else if (e.key === "ArrowRight" && viewerIndex < flatList.length - 1)
        setViewerIndex(viewerIndex + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [viewerIndex, flatList.length]);

  if (list.length === 0) return null;

  return (
    <div className="space-y-6">
      {groups.map((group, gIdx) => (
        <section key={group.key} className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground/80 px-1">
            {group.label}
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              · {group.items.length} item
              {group.items.length === 1 ? "" : "s"}
            </span>
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-1">
            {group.items.map((file) => {
              // Compute flat index for the viewer.
              const flatIndex = groups
                .slice(0, gIdx)
                .reduce((acc, g) => acc + g.items.length, 0)
                + group.items.indexOf(file);
              const selected = selectedIds.has(file.id);
              const isImg = isImageMime(file.mime ?? "");
              return (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setViewerIndex(flatIndex)}
                  className={cn(
                    "group relative aspect-square overflow-hidden bg-muted/40 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected && "ring-2 ring-primary",
                  )}>
                  {isImg ? (
                    <img
                      src={getImageUrl(file.url)}
                      alt={file.alternativeText ?? file.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground text-[10px] px-2">
                      <div className="text-2xl">📄</div>
                      <span className="truncate w-full text-center">
                        {file.name}
                      </span>
                    </div>
                  )}

                  {/* Bottom overlay with name on hover (Photos-style caption) */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white truncate">
                      {file.name}
                    </p>
                  </div>

                  {/* Selection chip top-left */}
                  <span
                    role="checkbox"
                    aria-checked={selected}
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelect(file.id);
                    }}
                    className={cn(
                      "absolute top-1.5 left-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all cursor-pointer",
                      selected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-black/30 border-white/80 opacity-0 group-hover:opacity-100",
                    )}>
                    {selected && (
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        className="w-3 h-3"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M3 8L7 12L13 4"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {viewerIndex !== null && flatList[viewerIndex] && (
        <MediaPhoneViewer
          file={flatList[viewerIndex]}
          index={viewerIndex}
          total={flatList.length}
          onClose={() => setViewerIndex(null)}
          onPrev={
            viewerIndex > 0 ? () => setViewerIndex(viewerIndex - 1) : undefined
          }
          onNext={
            viewerIndex < flatList.length - 1
              ? () => setViewerIndex(viewerIndex + 1)
              : undefined
          }
          onEdit={() => {
            const file = flatList[viewerIndex];
            setViewerIndex(null);
            onEdit(file);
          }}
          onRemove={() => {
            const file = flatList[viewerIndex];
            setViewerIndex(null);
            onRemove(file.id);
          }}
        />
      )}
    </div>
  );
}

function MediaPhoneViewer({
  file,
  index,
  total,
  onClose,
  onPrev,
  onNext,
  onEdit,
  onRemove,
}: {
  file: MediaFile;
  index: number;
  total: number;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const isImg = isImageMime(file.mime ?? "");
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${file.name}`}
      className="fixed inset-0 z-[60] flex flex-col bg-black/95 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 text-white"
        onClick={(e) => e.stopPropagation()}>
        <div className="text-sm font-medium truncate">
          {file.name}
          <span className="text-white/50 ml-2">
            {index + 1} / {total}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white hover:bg-white/10"
            onClick={onEdit}
            title="Edit details">
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white hover:bg-white/10 hover:text-rose-300"
            onClick={onRemove}
            title="Delete">
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white hover:bg-white/10"
            onClick={onClose}
            title="Close">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main viewer */}
      <div
        className="flex-1 flex items-center justify-center px-4 pb-4 relative"
        onClick={(e) => e.stopPropagation()}>
        {onPrev && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label="Previous"
            className="absolute left-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {isImg ? (
          <img
            src={getImageUrl(file.url)}
            alt={file.alternativeText ?? file.name}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-white text-center">
            <div className="text-6xl">📄</div>
            <p className="text-sm">{file.name}</p>
            {file.size != null && (
              <p className="text-xs text-white/60">{formatFileSize(file.size)}</p>
            )}
            <a
              href={getImageUrl(file.url)}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-300 hover:text-blue-200 underline">
              Open original
            </a>
          </div>
        )}

        {onNext && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            aria-label="Next"
            className="absolute right-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}
