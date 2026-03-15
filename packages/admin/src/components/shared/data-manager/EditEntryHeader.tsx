"use client";

import Link from "next/link";
import { Button, Card, CardContent } from "@enterprise/design-system";
import { ArrowLeft, Database, Trash2 } from "lucide-react";
import { FieldRenderer } from "@/components/fields/FieldRenderer";
import type { ContentTypeSchema } from "@/types";

export interface EditEntryHeaderProps {
  model: string;
  contentType: ContentTypeSchema;
  isNew: boolean;
  formData: Record<string, unknown>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  requestDelete: () => void;
  handleSave: () => void | Promise<void>;
  saving: boolean;
}

export const EditEntryHeader = ({
  model,
  contentType,
  isNew,
  formData,
  setFormData,
  requestDelete,
  handleSave,
  saving,
}: EditEntryHeaderProps) => {
  return (
    <>
      <div className="flex items-center gap-4 mb-6 animate-in fade-in duration-300">
        <Link href={`/data-manager/${model}`}>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 hover:translate-x-[-2px] transition-transform">
            <ArrowLeft className="w-4 h-4" /> Back to {contentType.displayName}
          </Button>
        </Link>
      </div>
      <Card className="w-full border-border/50 shadow-sm rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 delay-100">
        <CardContent className="p-8">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/50">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Database className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {isNew ? "Create new entry" : "Edit entry"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {contentType.displayName}
              </p>
            </div>
            {!isNew && (
              <Button
                variant="destructive"
                size="sm"
                className="gap-2 hover:bg-destructive/20 hover:text-destructive"
                onClick={requestDelete}>
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            )}
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
                  showRequired
                  gridSpan={isFullWidth ? "full" : "default"}
                />
              );
            })}
          </div>

          <div className="pt-8 border-t border-border/50 mt-8 flex gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Link href={`/data-manager/${model}`}>
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
