/**
 * Normalize display name to API-safe slug (lowercase, hyphens).
 */
export function toApiSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "-");
}

/**
 * Normalize for attribute name (lowercase, underscores, no spaces).
 */
export function toAttributeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

/**
 * Singular/plural from base name.
 */
export function toSingularPlural(base: string): { singular: string; plural: string } {
  const singular = base;
  const plural = base.endsWith("s") ? base : base + "s";
  return { singular, plural };
}

/**
 * Resolve actual field type from form state (text vs string, integer/float/etc, date/datetime/time).
 */
export function resolveFieldType(params: {
  fieldType: string;
  fieldTextType?: "short" | "long";
  fieldNumberFormat?: string;
  fieldDateType?: string;
}): string {
  const { fieldType, fieldTextType = "short", fieldNumberFormat = "integer", fieldDateType = "date" } = params;
  if (fieldType === "string" && fieldTextType === "long") return "text";
  if (fieldType === "integer") return fieldNumberFormat;
  if (fieldType === "date") return fieldDateType;
  return fieldType;
}

/**
 * Build UID for content type.
 */
export function buildContentTypeUid(kind: string, base: string, category?: string): string {
  if (kind === "component") {
    return `component::${category || "default"}.${base}`;
  }
  return `api::${base}.${base}`;
}

/**
 * Sanitize API name input (lowercase, alphanumeric and hyphen).
 */
export function sanitizeApiName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "-");
}
