"use client";

import { Button } from "@enterprise/design-system";
import { ArrowLeft, Plus, Settings, Trash2, Database } from "lucide-react";
import type { ContentTypeSchema } from "@/types";
import type { SchemaWithViewConfig } from "@/types/schema-builder";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";

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

  const variant: "primary" | "violet" | "blue" | "emerald" | "amber" =
    selectedCt.kind === "component"
      ? "amber"
      : selectedCt.kind === "dynamiczone"
        ? "violet"
        : selectedCt.kind === "singleType"
          ? "blue"
          : "emerald";

  const category = (selectedCt as { category?: string }).category;

  return (
    <div className="bg-card border-b border-border px-8 py-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-primary hover:underline mb-3">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>
      <PageHeader
        icon={Database}
        eyebrow="Schema Builder"
        title={selectedCt.displayName}
        description="Build the data architecture of your content."
        variant={variant}
        toolbar={
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[11px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-full",
                kindClass,
              )}>
              {kindLabel}
            </span>
            {category && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {category}
              </span>
            )}
            {(selectedCt.kind === "collectionType" ||
              selectedCt.kind === "singleType") && (
              <button
                onClick={() =>
                  onCustomizeLayout(selectedCt as SchemaWithViewConfig)
                }
                className="ml-auto flex items-center gap-1 text-sm text-primary hover:underline">
                <Settings className="w-3.5 h-3.5" /> Customize layout
              </button>
            )}
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={onAddField}>
              <Plus className="w-4 h-4" /> Add field
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="shrink-0"
              onClick={() => onDelete(selectedCt)}
              title="Delete schema">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        }
      />
    </div>
  );
}
