"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  Pencil,
  Trash2,
  ImageIcon,
  FileIcon,
  FileVideo,
  FileAudio,
  FileText,
  FileArchive,
  Maximize2,
} from "lucide-react";
import { Button, Badge } from "@enterprise/design-system";
import { cn } from "@/lib/utils";
import { getImageUrl, isImageMime } from "@/utils/media";

type MediaItem = Record<string, unknown>;

export interface MediaPreviewGridProps {
  items: MediaItem[];
  multiple: boolean;
  onChange: (next: MediaItem[]) => void;
  onOpenDetails: (item: MediaItem) => void;
}

function getKind(item: MediaItem): string {
  const mime = String(item.mime ?? "").toLowerCase();
  const url = String(item.url ?? "").toLowerCase();
  const v = mime || url;
  if (!v) return "file";
  if (isImageMime(v) || v.startsWith("image/")) return "image";
  if (v.startsWith("video/") || v.endsWith(".mp4") || v.endsWith(".webm"))
    return "video";
  if (v.startsWith("audio/") || v.endsWith(".mp3") || v.endsWith(".wav"))
    return "audio";
  if (v.includes("pdf") || v.endsWith(".pdf")) return "pdf";
  if (v.includes("zip") || v.includes("rar") || v.includes("7z")) return "archive";
  if (v.includes("json") || v.endsWith(".json") || v.includes("text")) return "text";
  return "file";
}

const KIND_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  image: ImageIcon,
  video: FileVideo,
  audio: FileAudio,
  pdf: FileText,
  text: FileText,
  archive: FileArchive,
  file: FileIcon,
};

/**
 * Selected-media display for the form field. Drop-in replacement for the
 * row-based card list — image previews get the real estate they deserve,
 * non-image assets keep a clean iconography, and clicking any item opens
 * a lightbox so users can verify what they picked without leaving the
 * form.
 */
export function MediaPreviewGrid({
  items,
  multiple,
  onChange,
  onOpenDetails,
}: MediaPreviewGridProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const removeAt = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const moveAt = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <>
      <div
        className={cn(
          "grid gap-3",
          items.length === 1
            ? "grid-cols-1 max-w-md"
            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
        )}>
        {items.map((item, i) => (
          <MediaCard
            key={(item.id as string | number | undefined) ?? i}
            item={item}
            index={i}
            total={items.length}
            multiple={multiple}
            onView={() => setLightboxIdx(i)}
            onDetails={() => onOpenDetails(item)}
            onRemove={() => removeAt(i)}
            onMoveUp={() => moveAt(i, i - 1)}
            onMoveDown={() => moveAt(i, i + 1)}
          />
        ))}
      </div>
      {lightboxIdx !== null && (
        <MediaLightbox
          items={items}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onIndex={setLightboxIdx}
        />
      )}
    </>
  );
}

function MediaCard({
  item,
  index,
  total,
  multiple,
  onView,
  onDetails,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  item: MediaItem;
  index: number;
  total: number;
  multiple: boolean;
  onView: () => void;
  onDetails: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const url = item.url as string | undefined;
  const name = (item.name as string) || `Asset ${index + 1}`;
  const mime = (item.mime as string) || "";
  const kind = getKind(item);
  const Icon = KIND_ICON[kind] ?? FileIcon;
  const isImg = kind === "image" && url;

  return (
    <div className="group relative rounded-xl border border-border bg-card overflow-hidden shadow-sm transition-all hover:shadow-md hover:border-primary/40">
      {/* Preview area */}
      <button
        type="button"
        onClick={onView}
        className="block w-full aspect-square bg-muted/40 relative overflow-hidden cursor-zoom-in">
        {isImg ? (
          <img
            src={getImageUrl(url!)}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Icon className="w-10 h-10" />
            <Badge variant="outline" className="text-[9px] uppercase">
              {kind}
            </Badge>
          </div>
        )}
        {/* Overlay on hover with zoom hint */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs font-medium shadow-sm">
            <Maximize2 className="w-3 h-3" /> Preview
          </span>
        </div>
        {/* Order pill */}
        {multiple && total > 1 && (
          <span className="absolute top-1.5 left-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-background/90 px-1.5 text-[10px] font-semibold shadow-sm">
            {index + 1}
          </span>
        )}
      </button>

      {/* Caption + actions */}
      <div className="p-2 space-y-1">
        <p className="text-xs font-medium truncate" title={name}>
          {name}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">
          {mime || "Unknown type"}
        </p>
      </div>

      {/* Hover toolbar */}
      <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-md bg-background/90 shadow-sm backdrop-blur-sm">
        {multiple && total > 1 && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="h-6 w-6"
              disabled={index === 0}
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}>
              <ChevronUp className="w-3 h-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="h-6 w-6"
              disabled={index === total - 1}
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onDetails();
          }}>
          <Pencil className="w-3 h-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

function MediaLightbox({
  items,
  index,
  onClose,
  onIndex,
}: {
  items: MediaItem[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const item = items[index];
  const total = items.length;

  // Keyboard navigation: Esc to close, arrows to navigate.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && index > 0) onIndex(index - 1);
      else if (e.key === "ArrowRight" && index < total - 1) onIndex(index + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, total, onClose, onIndex]);

  if (!item) return null;

  const url = item.url as string | undefined;
  const name = (item.name as string) || `Asset ${index + 1}`;
  const kind = getKind(item);
  const isImg = kind === "image" && url;
  const Icon = KIND_ICON[kind] ?? FileIcon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${name}`}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}>
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        aria-label="Close preview">
        <X className="w-5 h-5" />
      </button>

      {/* Prev */}
      {total > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (index > 0) onIndex(index - 1);
          }}
          disabled={index === 0}
          aria-label="Previous"
          className="absolute left-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Content */}
      <div
        className="max-w-[90vw] max-h-[85vh] flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}>
        {isImg ? (
          <img
            src={getImageUrl(url!)}
            alt={name}
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
          />
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-zinc-900 px-12 py-16 text-zinc-200">
            <Icon className="w-20 h-20 text-zinc-500" />
            <div className="text-center">
              <p className="text-base font-medium">{name}</p>
              <p className="text-xs text-zinc-500 mt-1">
                {String(item.mime ?? "")}
              </p>
            </div>
            {url && (
              <a
                href={getImageUrl(url)}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline">
                Open in new tab
              </a>
            )}
          </div>
        )}
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
          {index + 1} / {total}
          {name && <span className="ml-2 opacity-70">· {name}</span>}
        </div>
      </div>

      {/* Next */}
      {total > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (index < total - 1) onIndex(index + 1);
          }}
          disabled={index === total - 1}
          aria-label="Next"
          className="absolute right-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
