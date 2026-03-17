"use client";

import {
  Input,
  Label,
  Checkbox,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@enterprise/design-system";
import { FIELD_TYPES } from "@/consts";
import { CategoryCombobox } from "./CategoryCombobox";
import type { ContentTypeSchema } from "@/types";
import type { FieldFormState } from "@/types/schema-builder";
import { Layers, Link2 } from "lucide-react";
import { RELATION_TYPE_OPTIONS } from "@/consts/relation-types.const";

export interface SchemaBuilderNewFieldBasicTabProps {
  fieldForm: FieldFormState;
  setFieldForm: (u: Partial<FieldFormState> | ((prev: FieldFormState) => FieldFormState)) => void;
  contentTypes: ContentTypeSchema[];
  existingCategories: string[];
}

export function SchemaBuilderNewFieldBasicTab({
  fieldForm,
  setFieldForm,
  contentTypes,
  existingCategories,
}: SchemaBuilderNewFieldBasicTabProps) {
  const {
    fieldName,
    fieldType,
    fieldTextType,
    fieldNumberFormat,
    fieldDateType,
    enumValues,
    fieldTarget,
    fieldRelationType,
    fieldMediaMultiple,
    fieldComponent,
    fieldRepeatable,
    fieldComponents,
    compCreateMode,
    compNewDisplayName,
    compNewCategory,
  } = fieldForm;

  const targetSchema = contentTypes.find((c) => c.kind === "collectionType" && c.uid === fieldTarget);
  const targetDisplayName = targetSchema?.displayName ?? "…";

  return (
    <>
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={fieldName}
          onChange={(e) =>
            setFieldForm({ fieldName: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "_") })
          }
          placeholder="e.g. title, description, price"
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          No space is allowed for the name of the attribute
        </p>
      </div>

      {fieldType === "string" && (
        <div className="space-y-2">
          <Label>Type</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFieldForm({ fieldTextType: "short" })}
              className={`p-4 rounded-lg border text-left transition-all ${fieldTextType === "short" ? "border-primary ring-1 ring-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
            >
              <p className="font-semibold text-sm">Short text</p>
              <p className="text-xs text-muted-foreground mt-1">
                Best for titles, names, links (URL). Enables exact search.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setFieldForm({ fieldTextType: "long" })}
              className={`p-4 rounded-lg border text-left transition-all ${fieldTextType === "long" ? "border-primary ring-1 ring-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
            >
              <p className="font-semibold text-sm">Long text</p>
              <p className="text-xs text-muted-foreground mt-1">
                Best for descriptions, biography. Exact search is disabled.
              </p>
            </button>
          </div>
        </div>
      )}

      {fieldType === "integer" && (
        <div className="space-y-2">
          <Label>Number format</Label>
          <Select
            value={fieldNumberFormat || "integer"}
            onValueChange={(v) =>
              setFieldForm({ fieldNumberFormat: v ?? "integer" })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="integer">Integer (e.g. 10)</SelectItem>
              <SelectItem value="biginteger">Big integer</SelectItem>
              <SelectItem value="float">Float (e.g. 3.14)</SelectItem>
              <SelectItem value="decimal">Decimal (e.g. 9.99)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {fieldType === "date" && (
        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={fieldDateType || "date"}
            onValueChange={(v) => setFieldForm({ fieldDateType: v ?? "date" })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date only</SelectItem>
              <SelectItem value="datetime">Date &amp; Time</SelectItem>
              <SelectItem value="time">Time only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {fieldType === "enumeration" && (
        <div className="space-y-2">
          <Label>Values (one per line)</Label>
          <textarea
            className="w-full min-h-[100px] p-3 rounded-lg border border-input text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            value={enumValues}
            onChange={(e) => setFieldForm({ enumValues: e.target.value })}
            placeholder={"draft\npublished\narchived"}
          />
        </div>
      )}

      {fieldType === "relation" && (
        <div className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Relation type</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {RELATION_TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = fieldRelationType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFieldForm({ fieldRelationType: opt.id })}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-sm"
                        : "border-border hover:border-primary/40 hover:bg-muted/50"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${opt.color} transition-transform duration-200 ${isSelected ? "scale-110" : ""}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-center leading-tight">{opt.name}</span>
                    <span className="text-[10px] text-muted-foreground text-center line-clamp-2">{opt.shortDesc}</span>
                  </button>
                );
              })}
            </div>
            {fieldTarget && (
              <p className="text-sm text-muted-foreground mt-2">
                <span className="font-medium text-foreground">{targetDisplayName}</span>{" "}
                {RELATION_TYPE_OPTIONS.find((r) => r.id === fieldRelationType)?.label}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Target Schema</Label>
            <Select
              value={fieldTarget || ""}
              onValueChange={(v) => setFieldForm({ fieldTarget: v ?? "" })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select target..." />
              </SelectTrigger>
              <SelectContent>
                {contentTypes
                  .filter((c) => c.kind === "collectionType")
                  .map((ct) => (
                    <SelectItem key={ct.uid} value={ct.uid}>
                      {ct.displayName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {fieldType === "media" && (
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Type</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFieldForm({ fieldMediaMultiple: false })}
              className={`p-4 rounded-lg border-2 text-left transition-all ${!fieldMediaMultiple ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50"}`}
            >
              <p className="font-semibold text-sm">Single media</p>
              <p className="text-xs text-muted-foreground mt-1">Best for avatar, profile picture or cover</p>
            </button>
            <button
              type="button"
              onClick={() => setFieldForm({ fieldMediaMultiple: true })}
              className={`p-4 rounded-lg border-2 text-left transition-all ${fieldMediaMultiple ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50"}`}
            >
              <p className="font-semibold text-sm">Multiple media</p>
              <p className="text-xs text-muted-foreground mt-1">Best for sliders, carousels or multiple files</p>
            </button>
          </div>
        </div>
      )}

      {fieldType === "component" && (
        <div className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFieldForm({ compCreateMode: "create", fieldComponent: "" })}
                className={`p-3 rounded-lg border text-left transition-colors ${compCreateMode === "create" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/50"}`}
              >
                <p className="text-sm font-semibold">Create a new component</p>
                <p className="text-xs text-muted-foreground mt-0.5">Shared across types and components</p>
              </button>
              <button
                type="button"
                onClick={() => setFieldForm({ compCreateMode: "existing" })}
                className={`p-3 rounded-lg border text-left transition-colors ${compCreateMode === "existing" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/50"}`}
              >
                <p className="text-sm font-semibold">Use an existing component</p>
                <p className="text-xs text-muted-foreground mt-0.5">Reuse a component already created</p>
              </button>
            </div>
          </div>

          {compCreateMode === "create" ? (
            <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/20">
              <div className="space-y-2">
                <Label>Display name</Label>
                <Input
                  value={compNewDisplayName}
                  onChange={(e) => setFieldForm({ compNewDisplayName: e.target.value })}
                  placeholder="e.g. SEO, Hero Block"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <CategoryCombobox
                  value={compNewCategory}
                  onChange={(v) => setFieldForm({ compNewCategory: v })}
                  categories={existingCategories}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Select a component</Label>
                <Select
                  value={fieldComponent || ""}
                  onValueChange={(v) =>
                    setFieldForm({ fieldComponent: v ?? "" })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose component..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes
                      .filter((c) => c.kind === "component")
                      .map((ct) => (
                        <SelectItem key={ct.uid} value={ct.uid}>
                          {ct.displayName}
                          {(ct as { category?: string }).category
                            ? ` (${(ct as { category?: string }).category})`
                            : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {contentTypes.filter((c) => c.kind === "component").length === 0 && (
                  <p className="text-xs text-amber-500">No components found. Switch to &quot;Create a new component&quot;.</p>
                )}
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFieldForm({ fieldRepeatable: true })}
                className={`p-3 rounded-lg border text-left transition-colors ${fieldRepeatable ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/50"}`}
              >
                <p className="text-sm font-semibold">Repeatable component</p>
                <p className="text-xs text-muted-foreground mt-0.5">Best for multiple instances (array)</p>
              </button>
              <button
                type="button"
                onClick={() => setFieldForm({ fieldRepeatable: false })}
                className={`p-3 rounded-lg border text-left transition-colors ${!fieldRepeatable ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/50"}`}
              >
                <p className="text-sm font-semibold">Single component</p>
                <p className="text-xs text-muted-foreground mt-0.5">Best for grouping fields (object)</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {fieldType === "dynamiczone" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Add components to this dynamic zone. Users will pick which component to add when editing content.
          </p>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFieldForm({ compCreateMode: "create" })}
                className={`p-3 rounded-lg border text-left transition-colors ${compCreateMode === "create" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/50"}`}
              >
                <p className="text-sm font-semibold">Create a new component</p>
                <p className="text-xs text-muted-foreground mt-0.5">Shared across types and components</p>
              </button>
              <button
                type="button"
                onClick={() => setFieldForm({ compCreateMode: "existing" })}
                className={`p-3 rounded-lg border text-left transition-colors ${compCreateMode === "existing" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/50"}`}
              >
                <p className="text-sm font-semibold">Use existing components</p>
                <p className="text-xs text-muted-foreground mt-0.5">Reuse components already created</p>
              </button>
            </div>
          </div>

          {compCreateMode === "create" ? (
            <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/20">
              <div className="space-y-2">
                <Label>Display name</Label>
                <Input
                  value={compNewDisplayName}
                  onChange={(e) => setFieldForm({ compNewDisplayName: e.target.value })}
                  placeholder="e.g. Text Block, Hero Section"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <CategoryCombobox
                  value={compNewCategory}
                  onChange={(v) => setFieldForm({ compNewCategory: v })}
                  categories={existingCategories}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Select components to allow</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {contentTypes
                  .filter((c) => c.kind === "component")
                  .map((ct) => (
                    <label
                      key={ct.uid}
                      className="flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={fieldComponents.includes(ct.uid)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFieldForm({ fieldComponents: [...fieldComponents, ct.uid] });
                          } else {
                            setFieldForm({ fieldComponents: fieldComponents.filter((u) => u !== ct.uid) });
                          }
                        }}
                      />
                      <Layers className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium">{ct.displayName}</span>
                      {(ct as { category?: string }).category && (
                        <span className="text-xs text-muted-foreground ml-auto">{(ct as { category?: string }).category}</span>
                      )}
                    </label>
                  ))}
              </div>
              {contentTypes.filter((c) => c.kind === "component").length === 0 && (
                <p className="text-xs text-amber-500">No components found. Switch to &quot;Create a new component&quot;.</p>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
