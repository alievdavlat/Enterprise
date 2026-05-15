"use client";

import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
} from "@enterprise/design-system";
import { LayoutGrid, List, Smartphone, Check } from "lucide-react";
import { PAGE_SIZE_OPTIONS } from "@/consts";
import { cn } from "@/lib/utils";
import { StandardDialog } from "@/components/shared/StandardDialog";
import { IllustrationDocument } from "@/components/illustrations";
import type { SortOption } from "./MediaFilterBar";
import type { MediaViewMode } from "./MediaAssetsSection";

export interface MediaConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageSize: number;
  onPageSizeChange: (n: number) => void;
  sort: string;
  onSortChange: (value: string | null) => void;
  sortOptions: readonly SortOption[];
  viewMode?: MediaViewMode;
  onViewModeChange?: (mode: MediaViewMode) => void;
}

interface ViewTemplate {
  id: MediaViewMode;
  name: string;
  description: string;
  icon: typeof LayoutGrid;
  tint: string;
  preview: React.ReactNode;
}

const VIEW_TEMPLATES: ViewTemplate[] = [
  {
    id: "grid",
    name: "Card Grid",
    description: "Classic CMS cards with thumbnails + metadata.",
    icon: LayoutGrid,
    tint: "text-emerald-500 bg-emerald-100 dark:bg-emerald-950/40",
    preview: (
      <div className="grid grid-cols-3 gap-1 p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/3] rounded bg-gradient-to-br from-emerald-200 to-blue-200 dark:from-emerald-900/40 dark:to-blue-900/40"
          />
        ))}
      </div>
    ),
  },
  {
    id: "list",
    name: "List",
    description: "Compact table — best when you have hundreds of files.",
    icon: List,
    tint: "text-blue-500 bg-blue-100 dark:bg-blue-950/40",
    preview: (
      <div className="flex flex-col gap-1 p-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded bg-gradient-to-r from-blue-200 to-violet-200 dark:from-blue-900/40 dark:to-violet-900/40"
          />
        ))}
      </div>
    ),
  },
  {
    id: "phone",
    name: "Phone Gallery",
    description: "iPhone Photos look — edge-to-edge tiles grouped by month.",
    icon: Smartphone,
    tint: "text-violet-500 bg-violet-100 dark:bg-violet-950/40",
    preview: (
      <div className="grid grid-cols-4 gap-px p-2 bg-zinc-800/20">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-gradient-to-br from-violet-300 via-pink-300 to-amber-200 dark:from-violet-700 dark:via-pink-700 dark:to-amber-700"
          />
        ))}
      </div>
    ),
  },
];

export function MediaConfigDialog({
  open,
  onOpenChange,
  pageSize,
  onPageSizeChange,
  sort,
  onSortChange,
  sortOptions,
  viewMode,
  onViewModeChange,
}: MediaConfigDialogProps) {
  return (
    <StandardDialog
      open={open}
      onOpenChange={onOpenChange}
      tone="emerald"
      illustration={<IllustrationDocument size={120} />}
      title="Configure the view"
      description="Pick a layout, page size, and default sort. Choices persist for this device."
      size="lg"
      footer={<Button onClick={() => onOpenChange(false)}>Done</Button>}>
      {/* Layout template picker — mirrors the auth-template chooser in
          Settings → Users-permissions → Advanced, just for media. */}
      {onViewModeChange && (
        <div className="space-y-2">
          <Label>Default gallery view</Label>
          <div className="grid grid-cols-3 gap-3">
            {VIEW_TEMPLATES.map((tpl) => {
              const selected = tpl.id === viewMode;
              const Icon = tpl.icon;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => onViewModeChange(tpl.id)}
                  className={cn(
                    "group relative flex flex-col rounded-xl border-2 overflow-hidden text-left transition-all",
                    "hover:-translate-y-0.5 hover:shadow-md",
                    selected
                      ? "border-primary shadow-md ring-2 ring-primary/30"
                      : "border-border hover:border-primary/40",
                  )}>
                  <div className="aspect-[4/3] bg-muted/40 overflow-hidden">
                    {tpl.preview}
                  </div>
                  <div className="p-2.5 space-y-1 bg-card">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div
                          className={cn(
                            "inline-flex h-5 w-5 items-center justify-center rounded",
                            tpl.tint,
                          )}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <span className="text-xs font-semibold truncate">
                          {tpl.name}
                        </span>
                      </div>
                      {selected && (
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {tpl.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Entries per page</Label>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Default sort order</Label>
          <Select value={sort} onValueChange={onSortChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </StandardDialog>
  );
}
