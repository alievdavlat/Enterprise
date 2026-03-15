import type { ContentTypeAttributeConfig } from "@/types";
import { resolveFieldType } from "@/utils/schema-builder";
import type { FieldFormState } from "@/types";

export function buildFieldDefFromForm(form: FieldFormState): ContentTypeAttributeConfig {
  const actualType = resolveFieldType({
    fieldType: form.fieldType,
    fieldTextType: form.fieldTextType,
    fieldNumberFormat: form.fieldNumberFormat,
    fieldDateType: form.fieldDateType,
  });
  const fieldDef: ContentTypeAttributeConfig = { type: actualType };
  if (form.fieldRequired) fieldDef.required = true;
  if (form.fieldUnique) fieldDef.unique = true;
  if (form.fieldPrivate) fieldDef.private = true;
  if (form.fieldDefaultValue) fieldDef.default = form.fieldDefaultValue;
  if (form.fieldRegex) fieldDef.regex = form.fieldRegex;
  if (form.fieldMaxLength) fieldDef.maxLength = Number(form.fieldMaxLength);
  if (form.fieldMinLength) fieldDef.minLength = Number(form.fieldMinLength);
  if (form.fieldType === "enumeration" && form.enumValues.trim()) {
    fieldDef.enum = form.enumValues
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  if (form.fieldType === "relation" && form.fieldTarget) {
    fieldDef.target = form.fieldTarget;
    fieldDef.relation = form.fieldRelationType;
  }
  if (form.fieldType === "media") {
    if (form.fieldMediaMultiple) fieldDef.multiple = true;
    if (form.fieldMediaAllowedTypes?.length) fieldDef.allowedTypes = form.fieldMediaAllowedTypes;
  }
  if (form.fieldType === "component") {
    if (form.fieldComponent) fieldDef.component = form.fieldComponent;
    fieldDef.repeatable = form.fieldRepeatable;
  }
  if (form.fieldType === "dynamiczone" && form.fieldComponents.length > 0) {
    fieldDef.components = form.fieldComponents;
  }
  return fieldDef;
}
