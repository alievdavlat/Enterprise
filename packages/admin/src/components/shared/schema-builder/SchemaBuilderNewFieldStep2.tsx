"use client";

import { Button } from "@enterprise/design-system";
import { FIELD_TYPES } from "@/consts";
import type { ContentTypeSchema } from "@/types";
import type { FieldFormState } from "@/types/schema-builder";
import { ArrowLeft, Plus } from "lucide-react";
import { SchemaBuilderNewFieldBasicTab } from "./SchemaBuilderNewFieldBasicTab";
import { SchemaBuilderNewFieldAdvancedTab } from "./SchemaBuilderNewFieldAdvancedTab";

export interface SchemaBuilderNewFieldStep2Props {
  fieldForm: FieldFormState;
  setFieldForm: (u: Partial<FieldFormState> | ((prev: FieldFormState) => FieldFormState)) => void;
  contentTypes: ContentTypeSchema[];
  existingCategories: string[];
  onAddField: (andAddAnother: boolean) => void;
  onAddFirstFieldToComponent: () => void;
  onCancel: () => void;
}


export function SchemaBuilderNewFieldStep2({
  fieldForm,
  setFieldForm,
  contentTypes,
  existingCategories,
  onAddField,
  onAddFirstFieldToComponent,
  onCancel,
}: SchemaBuilderNewFieldStep2Props) {
  const {
    fieldType,
    fieldTab,
    fieldName,
    compCreateMode,
    compNewDisplayName,
  } = fieldForm;

  const stepTitle =
    fieldType === "component"
      ? `Add new component (${compCreateMode === "create" ? "1/2" : "2/2"})`
      : fieldType === "dynamiczone"
        ? "Add new component to the dynamic zone"
        : `Add new ${FIELD_TYPES.find((f) => f.id === fieldType)?.name} field`;
  const stepDesc =
    fieldType === "component"
      ? "Group of fields that you can repeat or reuse"
      : fieldType === "dynamiczone"
        ? "A type for modeling data"
        : FIELD_TYPES.find((f) => f.id === fieldType)?.desc;

  const showAddFirstField =
    (fieldType === "component" || fieldType === "dynamiczone") &&
    compCreateMode === "create";
  const canFinish = showAddFirstField ? fieldName && compNewDisplayName : fieldName;

  return (
    <div className="flex flex-col">
      <div className="px-6 pt-5 pb-0">
        <button
          onClick={() => setFieldForm({ fieldStep: 1 })}
          className="flex items-center gap-1 text-sm text-primary hover:underline mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <h3 className="text-lg font-bold">{stepTitle}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{stepDesc}</p>
      </div>

      <div className="flex gap-0 border-b border-border mt-4 px-6">
        <button
          onClick={() => setFieldForm({ fieldTab: "basic" })}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${fieldTab === "basic" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Basic Settings
        </button>
        <button
          onClick={() => setFieldForm({ fieldTab: "advanced" })}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${fieldTab === "advanced" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Advanced Settings
        </button>
      </div>

      <div className="px-6 py-5 space-y-5 max-h-[45vh] overflow-y-auto">
        {fieldTab === "basic" ? (
          <SchemaBuilderNewFieldBasicTab
            fieldForm={fieldForm}
            setFieldForm={setFieldForm}
            contentTypes={contentTypes}
            existingCategories={existingCategories}
          />
        ) : (
          <SchemaBuilderNewFieldAdvancedTab fieldForm={fieldForm} setFieldForm={setFieldForm} />
        )}
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex gap-2">
          {showAddFirstField ? (
            <>
              <Button
                variant="outline"
                className="gap-2"
                onClick={onAddFirstFieldToComponent}
                disabled={!canFinish}
              >
                <Plus className="w-4 h-4" /> Add first field to the component
              </Button>
              <Button onClick={() => onAddField(false)} disabled={!canFinish}>
                Finish
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => onAddField(true)}
                disabled={!fieldName}
              >
                <Plus className="w-4 h-4" /> Add field
              </Button>
              <Button onClick={() => onAddField(false)} disabled={!fieldName}>
                Finish
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
