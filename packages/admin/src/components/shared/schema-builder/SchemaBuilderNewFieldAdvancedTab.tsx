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
import type { FieldFormState } from "@/types/schema-builder";

export interface SchemaBuilderNewFieldAdvancedTabProps {
  fieldForm: FieldFormState;
  setFieldForm: (u: Partial<FieldFormState> | ((prev: FieldFormState) => FieldFormState)) => void;
}

export function SchemaBuilderNewFieldAdvancedTab({
  fieldForm,
  setFieldForm,
}: SchemaBuilderNewFieldAdvancedTabProps) {
  const {
    fieldType,
    fieldDefaultValue,
    fieldRegex,
    fieldRequired,
    fieldUnique,
    fieldPrivate,
    fieldMaxLength,
    fieldMinLength,
    fieldMediaAllowedTypes,
  } = fieldForm;

  const textLike = ["string", "text", "richtext", "email", "password", "uid", "enumeration"];
  const numberLike = ["integer", "float", "decimal", "biginteger"];
  const hasMaxMin = ["string", "text", "richtext", "email", "password", "uid"];
  const noUnique = ["boolean", "json", "richtext", "text", "component", "dynamiczone", "media"];

  const MEDIA_TYPE_OPTIONS = [
    { id: "images", label: "Images (JPEG, PNG, GIF, SVG, etc.)" },
    { id: "videos", label: "Videos (MPEG, MP4, WebM, etc.)" },
    { id: "audios", label: "Audios (MP3, WAV, OGG)" },
    { id: "files", label: "Files (PDF, CSV, ZIP, etc.)" },
  ];

  const toggleMediaType = (id: string) => {
    const allIds = MEDIA_TYPE_OPTIONS.map((o) => o.id);
    let next: string[];
    if (fieldMediaAllowedTypes.length === 0) {
      next = allIds.filter((t) => t !== id);
    } else if (fieldMediaAllowedTypes.includes(id)) {
      next = fieldMediaAllowedTypes.filter((t) => t !== id);
    } else {
      next = [...fieldMediaAllowedTypes, id];
    }
    setFieldForm({ fieldMediaAllowedTypes: next });
  };

  return (
    <>
      {fieldType === "media" && (
        <div className="space-y-3">
          <Label>Select allowed types of media</Label>
          <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/20">
            {MEDIA_TYPE_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={fieldMediaAllowedTypes.length === 0 || fieldMediaAllowedTypes.includes(opt.id)}
                  onCheckedChange={() => toggleMediaType(opt.id)}
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Leave all unchecked to allow all types</p>
        </div>
      )}

      {textLike.includes(fieldType) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Default value</Label>
            <Input
              value={fieldDefaultValue}
              onChange={(e) => setFieldForm({ fieldDefaultValue: e.target.value })}
              placeholder=""
            />
          </div>
          {["string", "text", "richtext", "email", "password", "uid"].includes(fieldType) && (
            <div className="space-y-2">
              <Label>RegExp pattern</Label>
              <Input
                value={fieldRegex}
                onChange={(e) => setFieldForm({ fieldRegex: e.target.value })}
                placeholder=""
              />
              <p className="text-xs text-muted-foreground">The text of the regular expression</p>
            </div>
          )}
        </div>
      )}

      {numberLike.includes(fieldType) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Default value</Label>
            <Input
              type="number"
              value={fieldDefaultValue}
              onChange={(e) => setFieldForm({ fieldDefaultValue: e.target.value })}
              placeholder=""
            />
          </div>
        </div>
      )}

      {fieldType === "boolean" && (
        <div className="space-y-2">
          <Label>Default value</Label>
          <Select
            value={fieldDefaultValue || ""}
            onValueChange={(v) => setFieldForm({ fieldDefaultValue: v ?? "" })}
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
            <Checkbox
              checked={fieldRequired}
              onCheckedChange={(c) => setFieldForm({ fieldRequired: !!c })}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium">Required field</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You won&apos;t be able to create an entry if this field is empty
              </p>
            </div>
          </label>

          {!noUnique.includes(fieldType) && (
            <label className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors">
              <Checkbox
                checked={fieldUnique}
                onCheckedChange={(c) => setFieldForm({ fieldUnique: !!c })}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium">Unique field</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No existing entry can have identical content
                </p>
              </div>
            </label>
          )}

          {hasMaxMin.includes(fieldType) && (
            <label className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors">
              <Checkbox
                checked={!!fieldMaxLength}
                onCheckedChange={(c) => setFieldForm({ fieldMaxLength: c ? "255" : "" })}
                className="mt-0.5"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">Maximum length</p>
                {fieldMaxLength && (
                  <Input
                    type="number"
                    value={fieldMaxLength}
                    onChange={(e) => setFieldForm({ fieldMaxLength: e.target.value })}
                    className="mt-2 h-8"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
            </label>
          )}

          {hasMaxMin.includes(fieldType) && (
            <label className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors">
              <Checkbox
                checked={!!fieldMinLength}
                onCheckedChange={(c) => setFieldForm({ fieldMinLength: c ? "0" : "" })}
                className="mt-0.5"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">Minimum length</p>
                {fieldMinLength && (
                  <Input
                    type="number"
                    value={fieldMinLength}
                    onChange={(e) => setFieldForm({ fieldMinLength: e.target.value })}
                    className="mt-2 h-8"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
            </label>
          )}

          <label className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors">
            <Checkbox
              checked={fieldPrivate}
              onCheckedChange={(c) => setFieldForm({ fieldPrivate: !!c })}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium">Private field</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                This field will not show up in the API response
              </p>
            </div>
          </label>
        </div>
      </div>
    </>
  );
}
