"use client";

import { Database } from "lucide-react";
import { Button } from "@enterprise/design-system";
import { FieldRenderer } from "@/components/fields/FieldRenderer";
import { DataTable } from "../data-table";
import type { ContentTypeSchema } from "@/types";
import type { ColumnDef, VisibilityState } from "@enterprise/design-system/table";

export interface ModelContentProps {
  contentType: ContentTypeSchema;
  model: string;
  columns: ColumnDef<Record<string, unknown>, unknown>[];
  data: Record<string, unknown>[];
  loading: boolean;
  defaultSearchColumnId: string;
  formData: Record<string, unknown>;
  meta: { pagination?: { page?: number; pageCount?: number; total?: number } };
  initialColumnVisibility: VisibilityState;
  handleColumnVisibilityChange: (visibility: VisibilityState) => void;
  setPage: (page: number | ((p: number) => number)) => void;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  handleSave: () => void | Promise<void>;
}

export const ModelContent = ({
  contentType,
  model,
  columns,
  data,
  loading,
  defaultSearchColumnId,
  formData,
  meta,
  initialColumnVisibility,
  handleColumnVisibilityChange,
  setPage,
  setFormData,
  handleSave,
}: ModelContentProps) => {
  return (
    <div className="flex-1 bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
      {contentType.kind !== "singleType" ? (
        <DataTable
          key={model}
          columns={columns}
          data={data}
          loading={loading}
          searchColumn={defaultSearchColumnId}
          searchPlaceholder={`Search ${contentType.pluralName}...`}
          paginationMeta={
            meta?.pagination
              ? {
                  page: meta.pagination.page ?? 1,
                  pageCount: meta.pagination.pageCount ?? 1,
                  total: meta.pagination.total ?? data.length,
                }
              : undefined
          }
          onPageChange={(nextPage) => setPage(Math.max(1, nextPage || 1))}
          initialColumnVisibility={initialColumnVisibility}
          onColumnVisibilityChange={handleColumnVisibilityChange}
        />
      ) : (
        <div className="p-8 w-full animate-in fade-in duration-500">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/50">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary ring-4 ring-primary/5">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {contentType.displayName} Data
              </h2>
              <p className="text-muted-foreground">
                Single Schema configuration
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(contentType.attributes).map(([field, config]) => {
                const type = config.type;
                const isFullWidth = [
                  "richtext",
                  "component",
                  "dynamiczone",
                  "text",
                  "json",
                ].includes(type);
                return (
                  <FieldRenderer
                    key={field}
                    field={field}
                    config={config}
                    value={formData[field]}
                    onChange={(v) => setFormData({ ...formData, [field]: v })}
                    gridSpan={isFullWidth ? "full" : "default"}
                  />
                );
              },
            )}
          </div>
          <div className="pt-8 border-t border-border/50 mt-8">
            <Button
              onClick={handleSave}
              size="lg"
              className="px-8 shadow-sm hover:scale-[1.02] transition-transform">
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
