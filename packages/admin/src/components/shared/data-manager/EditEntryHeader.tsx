"use client";

import { Card, CardContent, Button } from "@enterprise/design-system";
import { Database, Trash2 } from "lucide-react";
import { FieldRenderer } from "@/components/fields/FieldRenderer";
import type { ContentTypeSchema } from "@/types";

export interface EditEntryHeaderProps {
  model: string;
  contentType: ContentTypeSchema;
  isNew: boolean;
  formData: Record<string, unknown>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  requestDelete: () => void;
}

export const EditEntryHeader = ({
  contentType,
  isNew,
  formData,
  setFormData,
  requestDelete,
}: EditEntryHeaderProps) => {
  return (
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
              variant="ghost"
              size="sm"
              className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
      </CardContent>
    </Card>
  );
};
