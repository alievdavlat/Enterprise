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
import type { ContentTypeSchema } from "@/types";
import type { FieldFormState } from "@/types/schema-builder";
import { Layers } from "lucide-react";

export interface SchemaBuilderEditFieldFormProps {
  fieldForm: FieldFormState;
  setFieldForm: (u: Partial<FieldFormState> | ((prev: FieldFormState) => FieldFormState)) => void;
  contentTypes: ContentTypeSchema[];
}

export function SchemaBuilderEditFieldForm({
  fieldForm,
  setFieldForm,
  contentTypes,
}: SchemaBuilderEditFieldFormProps) {
  const {
    fieldTab,
    fieldName,
    fieldType,
    fieldTextType,
    fieldNumberFormat,
    fieldDateType,
    enumValues,
    fieldTarget,
    fieldComponent,
    fieldRepeatable,
    fieldComponents,
    fieldDefaultValue,
    fieldRegex,
    fieldRequired,
    fieldUnique,
    fieldPrivate,
    fieldMaxLength,
    fieldMinLength,
  } = fieldForm;

  const textLike = ["string", "text", "richtext", "email", "password", "uid", "enumeration"];
  const numberLike = ["integer", "float", "decimal", "biginteger"];
  const hasMaxMin = ["string", "text", "richtext", "email", "password", "uid"];
  const noUnique = ["boolean", "json", "richtext", "text", "component", "dynamiczone", "media"];

  if (fieldTab === "basic") {
    return (
      <div className="px-6 py-5 max-h-[50vh] overflow-y-auto space-y-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={fieldName}
            onChange={(e) => setFieldForm({ fieldName: e.target.value.replace(/\s/g, "") })}
            placeholder="fieldName"
          />
          <p className="text-xs text-muted-foreground">No space is allowed for the name of the attribute</p>
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
                <p className="text-xs text-muted-foreground mt-1">Best for titles, names, links (URL). Enables exact search.</p>
              </button>
              <button
                type="button"
                onClick={() => setFieldForm({ fieldTextType: "long" })}
                className={`p-4 rounded-lg border text-left transition-all ${fieldTextType === "long" ? "border-primary ring-1 ring-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              >
                <p className="font-semibold text-sm">Long text</p>
                <p className="text-xs text-muted-foreground mt-1">Best for descriptions, biography. Exact search is disabled.</p>
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
              onValueChange={(v) =>
                setFieldForm({ fieldDateType: v ?? "date" })
              }
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
        )}

        {fieldType === "component" && (
          <div className="space-y-4">
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
            </div>
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
          <div className="space-y-2">
            <Label>Allowed Components</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {contentTypes.filter((c) => c.kind === "component").map((ct) => (
                <label
                  key={ct.uid}
                  className="flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={fieldComponents.includes(ct.uid)}
                    onCheckedChange={(checked) => {
                      if (checked) setFieldForm({ fieldComponents: [...fieldComponents, ct.uid] });
                      else setFieldForm({ fieldComponents: fieldComponents.filter((u) => u !== ct.uid) });
                    }}
                  />
                  <Layers className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium">{ct.displayName}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-6 py-5 max-h-[50vh] overflow-y-auto space-y-4">
      {textLike.includes(fieldType) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Default value</Label>
            <Input value={fieldDefaultValue} onChange={(e) => setFieldForm({ fieldDefaultValue: e.target.value })} />
          </div>
          {["string", "text", "richtext", "email", "password", "uid"].includes(fieldType) && (
            <div className="space-y-2">
              <Label>RegExp pattern</Label>
              <Input value={fieldRegex} onChange={(e) => setFieldForm({ fieldRegex: e.target.value })} />
            </div>
          )}
        </div>
      )}

      {numberLike.includes(fieldType) && (
        <div className="space-y-2">
          <Label>Default value</Label>
          <Input
            type="number"
            value={fieldDefaultValue}
            onChange={(e) => setFieldForm({ fieldDefaultValue: e.target.value })}
          />
        </div>
      )}

      {fieldType === "boolean" && (
        <div className="space-y-2">
          <Label>Default value</Label>
          <Select
            value={fieldDefaultValue || ""}
            onValueChange={(v) =>
              setFieldForm({ fieldDefaultValue: v ?? "" })
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold mb-3">Settings</h4>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors">
            <Checkbox checked={fieldRequired} onCheckedChange={(c) => setFieldForm({ fieldRequired: !!c })} className="mt-0.5" />
            <div>
              <p className="text-sm font-medium">Required field</p>
              <p className="text-xs text-muted-foreground mt-0.5">You won&apos;t be able to create an entry if this field is empty</p>
            </div>
          </label>
          {!noUnique.includes(fieldType) && (
            <label className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors">
              <Checkbox checked={fieldUnique} onCheckedChange={(c) => setFieldForm({ fieldUnique: !!c })} className="mt-0.5" />
              <div>
                <p className="text-sm font-medium">Unique field</p>
                <p className="text-xs text-muted-foreground mt-0.5">No existing entry can have identical content</p>
              </div>
            </label>
          )}
          <label className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors">
            <Checkbox checked={fieldPrivate} onCheckedChange={(c) => setFieldForm({ fieldPrivate: !!c })} className="mt-0.5" />
            <div>
              <p className="text-sm font-medium">Private field</p>
              <p className="text-xs text-muted-foreground mt-0.5">This field will not show up in the API response</p>
            </div>
          </label>
        </div>
      </div>

      {hasMaxMin.includes(fieldType) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Maximum length</Label>
            <Input type="number" value={fieldMaxLength} onChange={(e) => setFieldForm({ fieldMaxLength: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Minimum length</Label>
            <Input type="number" value={fieldMinLength} onChange={(e) => setFieldForm({ fieldMinLength: e.target.value })} />
          </div>
        </div>
      )}
    </div>
  );
}
