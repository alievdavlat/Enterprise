"use client";

import { Button } from "@enterprise/design-system";
import { FIELD_TYPES } from "@/consts";
import type { ContentTypeSchema } from "@/types";
import type {
  FieldFormState,
  SchemaWithCategory,
} from "@/types/schema-builder";
import { SchemaBuilderEditFieldForm } from "./SchemaBuilderEditFieldForm";
import { StandardDialog } from "@/components/shared/StandardDialog";
import { IllustrationDocument } from "@/components/illustrations";

export interface SchemaBuilderEditFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldForm: FieldFormState;
  setFieldForm: (
    u: Partial<FieldFormState> | ((prev: FieldFormState) => FieldFormState),
  ) => void;
  contentTypes: ContentTypeSchema[];
  selectedCt: ContentTypeSchema | SchemaWithCategory | null;
  editingFieldName: string | null;
  onSave: () => void;
  onClose: () => void;
}

export function SchemaBuilderEditFieldDialog({
  open,
  onOpenChange,
  fieldForm,
  setFieldForm,
  contentTypes,
  selectedCt,
  editingFieldName,
  onSave,
  onClose,
}: SchemaBuilderEditFieldDialogProps) {
  const { fieldType } = fieldForm;
  const ftDef = FIELD_TYPES.find((f) => f.id === fieldType);

  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
    if (!o) onClose();
  };

  return (
    <StandardDialog
      open={open}
      onOpenChange={handleOpenChange}
      illustration={<IllustrationDocument size={120} />}
      title={`Edit ${editingFieldName ?? "field"}`}
      description={`${selectedCt?.displayName ?? "Schema"} · ${ftDef?.desc ?? ""}`}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={!fieldForm.fieldName}>
            Finish
          </Button>
        </>
      }>
      <div className="flex flex-col -mx-4">
        <div className="flex gap-0 border-b border-border px-4">
          <button
            onClick={() => setFieldForm({ fieldTab: "basic" })}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              fieldForm.fieldTab === "basic"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            Basic Settings
          </button>
          <button
            onClick={() => setFieldForm({ fieldTab: "advanced" })}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              fieldForm.fieldTab === "advanced"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            Advanced Settings
          </button>
        </div>

        <div className="px-4">
          <SchemaBuilderEditFieldForm
            fieldForm={fieldForm}
            setFieldForm={setFieldForm}
            contentTypes={contentTypes}
          />
        </div>
      </div>
    </StandardDialog>
  );
}
