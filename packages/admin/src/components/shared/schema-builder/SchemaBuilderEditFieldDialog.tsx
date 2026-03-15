"use client";

import { Button, Modal } from "@enterprise/design-system";
import { FIELD_TYPES } from "@/consts";
import type { ContentTypeSchema } from "@/types";
import type { FieldFormState, SchemaWithCategory } from "@/types/schema-builder";
import { Type } from "lucide-react";
import { SchemaBuilderEditFieldForm } from "./SchemaBuilderEditFieldForm";

export interface SchemaBuilderEditFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldForm: FieldFormState;
  setFieldForm: (u: Partial<FieldFormState> | ((prev: FieldFormState) => FieldFormState)) => void;
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
  const FtIcon = ftDef?.icon ?? Type;

  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
    if (!o) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={() => handleOpenChange(false)}
      footer={
        <>
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={!fieldForm.fieldName}>
            Finish
          </Button>
        </>
      }>
      <div className="sm:max-w-[720px] p-0 gap-0 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/30">
          <div className={`w-8 h-8 rounded flex items-center justify-center ${ftDef?.color ?? "bg-muted"}`}>
            <FtIcon className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm">{selectedCt?.displayName}</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold text-sm capitalize">{editingFieldName}</span>
        </div>

        <div className="flex flex-col">
          <div className="px-6 pt-5 pb-0">
            <h3 className="text-lg font-bold">Edit {editingFieldName}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {FIELD_TYPES.find((f) => f.id === fieldType)?.desc}
            </p>
          </div>

          <div className="flex gap-0 border-b border-border mt-4 px-6">
            <button
              onClick={() => setFieldForm({ fieldTab: "basic" })}
              className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${fieldForm.fieldTab === "basic" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              Basic Settings
            </button>
            <button
              onClick={() => setFieldForm({ fieldTab: "advanced" })}
              className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${fieldForm.fieldTab === "advanced" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              Advanced Settings
            </button>
          </div>

          <SchemaBuilderEditFieldForm
            fieldForm={fieldForm}
            setFieldForm={setFieldForm}
            contentTypes={contentTypes}
          />
        </div>
      </div>
    </Modal>
  );
}
