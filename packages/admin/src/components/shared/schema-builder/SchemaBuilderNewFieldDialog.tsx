"use client";

import { Modal } from "@enterprise/design-system";
import { FIELD_TYPES } from "@/consts";
import type { ContentTypeSchema } from "@/types";
import type { FieldFormState, SchemaWithCategory } from "@/types/schema-builder";
import { SchemaBuilderNewFieldStep2 } from "./SchemaBuilderNewFieldStep2";

export interface SchemaBuilderNewFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldForm: FieldFormState;
  setFieldForm: (u: Partial<FieldFormState> | ((prev: FieldFormState) => FieldFormState)) => void;
  contentTypes: ContentTypeSchema[];
  existingCategories: string[];
  selectedCt: ContentTypeSchema | SchemaWithCategory | null;
  fieldTargetSchema: ContentTypeSchema | SchemaWithCategory | null;
  onAddField: (andAddAnother: boolean) => void;
  onAddFirstFieldToComponent: () => void;
}

export function SchemaBuilderNewFieldDialog({
  open,
  onOpenChange,
  fieldForm,
  setFieldForm,
  contentTypes,
  existingCategories,
  selectedCt,
  fieldTargetSchema,
  onAddField,
  onAddFirstFieldToComponent,
}: SchemaBuilderNewFieldDialogProps) {
  const displayName = (fieldTargetSchema || selectedCt)?.displayName;
  const { fieldStep, fieldType, fieldName } = fieldForm;

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
    >
      <div className="sm:max-w-[720px] p-0 gap-0 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/30">
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
            {displayName?.substring(0, 2).toUpperCase() ?? "??"}
          </div>
          <span className="font-semibold text-sm">{displayName}</span>
          {fieldStep === 2 && (fieldType === "component" || fieldType === "dynamiczone") && fieldName && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="font-semibold text-sm capitalize">{fieldName}</span>
            </>
          )}
        </div>

        {fieldStep === 1 ? (
          <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              {FIELD_TYPES.map((ft) => {
                const Icon = ft.icon;
                return (
                  <button
                    key={ft.id}
                    onClick={() => {
                      setFieldForm({ fieldType: ft.id, fieldStep: 2 });
                    }}
                    className="flex items-start gap-3 p-4 rounded-lg border border-border text-left transition-all hover:border-primary/50 hover:bg-muted/30 group"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${ft.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {ft.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {ft.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <SchemaBuilderNewFieldStep2
            fieldForm={fieldForm}
            setFieldForm={setFieldForm}
            contentTypes={contentTypes}
            existingCategories={existingCategories}
            onAddField={onAddField}
            onAddFirstFieldToComponent={onAddFirstFieldToComponent}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </div>
    </Modal>
  );
}
