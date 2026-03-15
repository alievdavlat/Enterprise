"use client";

import { Button } from "@enterprise/design-system";
import { ArrowLeft, Plus, Settings, Trash2 } from "lucide-react";
import type { ContentTypeSchema } from "@/types";
import type { SchemaWithViewConfig } from "@/types/schema-builder";

export interface SchemaBuilderHeaderProps {
  selectedCt: ContentTypeSchema | null;
  onBack: () => void;
  onAddField: () => void;
  onDelete: (ct: ContentTypeSchema) => void;
  onCustomizeLayout: (ct: SchemaWithViewConfig) => void;
}

export function SchemaBuilderHeader({
  selectedCt,
  onBack,
  onAddField,
  onDelete,
  onCustomizeLayout,
}: SchemaBuilderHeaderProps) {
  if (!selectedCt) return null;

  const kindLabel =
    selectedCt.kind === "singleType"
      ? "Single Schema"
      : selectedCt.kind === "component"
        ? "Component"
        : selectedCt.kind === "dynamiczone"
          ? "Dynamic Zone"
          : "Collection Schema";

  const kindClass =
    selectedCt.kind === "component"
      ? "bg-yellow-500/10 text-yellow-600"
      : selectedCt.kind === "dynamiczone"
        ? "bg-purple-500/10 text-purple-600"
        : selectedCt.kind === "singleType"
          ? "bg-blue-500/10 text-blue-600"
          : "bg-emerald-500/10 text-emerald-600";

  const category = (selectedCt as { category?: string }).category;

  return (
    <div className="bg-card border-b border-border px-8 py-6">
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-primary hover:underline mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {selectedCt.displayName}
            </h1>
            <span
              className={`text-[11px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-full ${kindClass}`}
            >
              {kindLabel}
            </span>
            {category && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {category}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Build the data architecture of your content
          </p>
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Button variant="outline" className="gap-2" onClick={onAddField}>
            <Plus className="w-4 h-4" /> Add field
          </Button>
          <Button
            variant="danger"
            size="icon"
            className="shrink-0"
            onClick={() => onDelete(selectedCt)}
            title="Delete schema"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {(selectedCt.kind === "collectionType" || selectedCt.kind === "singleType") && (
        <div className="flex justify-end mt-3">
          <button
            onClick={() => onCustomizeLayout(selectedCt as SchemaWithViewConfig)}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Settings className="w-3.5 h-3.5" /> Customize layout
          </button>
        </div>
      )}
    </div>
  );
}
