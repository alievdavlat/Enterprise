import type { DatabaseAdapter } from "@enterprise/database";

/** Pure helpers for the content-type REST router (id parsing, validation, history, search). */
export const DOCUMENT_ID_LENGTH = 24;
export function looksLikeDocumentId(id: string): boolean {
  return id.length === DOCUMENT_ID_LENGTH && /^[a-zA-Z0-9]+$/.test(id);
}

export function ensureDocumentId(row: Record<string, unknown>): Record<string, unknown> {
  if (row.documentId) return row;
  return { ...row, documentId: row.documentId ?? String(row.id ?? "") };
}

export async function recordHistory(
  db: DatabaseAdapter,
  uid: string,
  snapshot: Record<string, unknown> | null,
  status: string,
  user?: { id?: number; email?: string } | null,
): Promise<void> {
  if (!snapshot) return;
  try {
    await db.create("enterprise_content_history", {
      uid,
      documentId: typeof snapshot.documentId === "string" ? snapshot.documentId : null,
      entryId: typeof snapshot.id === "number" ? snapshot.id : null,
      data: JSON.stringify(snapshot),
      status,
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
    });
  } catch {
    // history is best-effort – don't block the main operation
  }
}

export async function fetchEntryByIdOrDocId(
  db: DatabaseAdapter,
  collectionName: string,
  id: string | number,
): Promise<Record<string, unknown> | null> {
  if (typeof id === "string" && looksLikeDocumentId(id)) {
    const row = await db.findOneBy(collectionName, { documentId: id });
    return row as Record<string, unknown> | null;
  }
  const idVal = Number(id) || id;
  const row = await db.findOne(collectionName, idVal as number);
  return row as Record<string, unknown> | null;
}

export interface FieldConfig {
  type?: string;
  required?: boolean;
  unique?: boolean;
  maxLength?: number;
  minLength?: number;
  regex?: string;
  default?: unknown;
  private?: boolean;
  enum?: string[];
  relation?: string;
}

export function validateAndApplyDefaults(
  data: Record<string, unknown>,
  attributes: Record<string, FieldConfig>,
  isUpdate: boolean,
): { data: Record<string, unknown>; errors: string[] } {
  const errors: string[] = [];
  const result = { ...data };

  for (const [field, config] of Object.entries(attributes)) {
    const value = result[field];
    const isEmpty = value === undefined || value === null || value === "";

    if (!isUpdate && isEmpty && config.default !== undefined) {
      result[field] = config.default;
      continue;
    }

    if (config.required && isEmpty && !isUpdate) {
      errors.push(`"${field}" is required`);
      continue;
    }

    if (isEmpty) continue;

    const strVal = typeof value === "string" ? value : undefined;

    if (strVal !== undefined && config.maxLength && strVal.length > config.maxLength) {
      errors.push(`"${field}" exceeds maximum length of ${config.maxLength}`);
    }

    if (strVal !== undefined && config.minLength && strVal.length < config.minLength) {
      errors.push(`"${field}" is shorter than minimum length of ${config.minLength}`);
    }

    if (strVal !== undefined && config.regex) {
      try {
        if (!new RegExp(config.regex).test(strVal)) {
          errors.push(`"${field}" does not match pattern ${config.regex}`);
        }
      } catch {
        // Invalid regex in schema — skip validation
      }
    }

    if (config.type === "enumeration" && Array.isArray(config.enum) && strVal !== undefined) {
      if (!config.enum.includes(strVal)) {
        errors.push(`"${field}" must be one of: ${config.enum.join(", ")}`);
      }
    }

    if (config.type === "email" && strVal !== undefined) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
        errors.push(`"${field}" is not a valid email address`);
      }
    }

    if ((config.type === "integer" || config.type === "biginteger") && value !== undefined && value !== null && value !== "") {
      if (!Number.isInteger(Number(value)) || isNaN(Number(value))) {
        errors.push(`"${field}" must be an integer`);
      }
    }

    if ((config.type === "float" || config.type === "decimal") && value !== undefined && value !== null && value !== "") {
      if (isNaN(Number(value))) {
        errors.push(`"${field}" must be a number`);
      }
    }

    if (config.type === "boolean" && value !== undefined && value !== null) {
      if (typeof value !== "boolean" && value !== 0 && value !== 1 && value !== "true" && value !== "false") {
        errors.push(`"${field}" must be a boolean`);
      }
    }

    if (config.type === "relation" && value !== undefined && value !== null && value !== "") {
      const isMulti = config.relation === "oneToMany" || config.relation === "manyToMany";
      if (isMulti) {
        const arr = Array.isArray(value) ? value : [value];
        const invalid = arr.some((v) => typeof v !== "number" || !Number.isInteger(v) || isNaN(v));
        if (invalid) {
          errors.push(`"${field}" must be an array of integers`);
        } else {
          result[field] = arr;
        }
      } else {
        const n = Number(value);
        if (!Number.isInteger(n) || isNaN(n)) {
          errors.push(`"${field}" must be an integer`);
        } else {
          result[field] = n;
        }
      }
    }
  }

  return { data: result, errors };
}

export async function checkUniqueConstraints(
  db: DatabaseAdapter,
  collectionName: string,
  data: Record<string, unknown>,
  attributes: Record<string, FieldConfig>,
  excludeId?: string | number,
): Promise<string[]> {
  const errors: string[] = [];
  for (const [field, config] of Object.entries(attributes)) {
    if (!config.unique) continue;
    const value = data[field];
    if (value === undefined || value === null || value === "") continue;
    const existing = await db.findOneBy(collectionName, { [field]: value });
    if (existing) {
      const existingId = (existing as Record<string, unknown>).id ?? (existing as Record<string, unknown>).documentId;
      if (excludeId !== undefined && String(existingId) === String(excludeId)) continue;
      errors.push(`"${field}" must be unique — value "${value}" already exists`);
    }
  }
  return errors;
}

export function stripPrivateFields(
  row: Record<string, unknown>,
  attributes: Record<string, FieldConfig>,
): Record<string, unknown> {
  const result = { ...row };
  for (const [field, config] of Object.entries(attributes)) {
    if (config.private) {
      delete result[field];
    }
  }
  return result;
}

export const SEARCHABLE_DEFAULT_TYPES = new Set(["string", "text", "richtext", "email", "uid"]);

/**
 * Pick the fields to text-search over. If any field on the schema is marked
 * `searchable: true`, that opt-in set wins. Otherwise we fall back to every
 * string-like field so a fresh schema gets reasonable behaviour for free.
 */
export function resolveSearchFields(
  attributes: Record<string, FieldConfig & { searchable?: boolean }>,
): string[] {
  const opted = Object.entries(attributes).filter(([, c]) => c.searchable);
  if (opted.length > 0) return opted.map(([name]) => name);
  return Object.entries(attributes)
    .filter(([, c]) => SEARCHABLE_DEFAULT_TYPES.has(c.type ?? ""))
    .map(([name]) => name);
}

/**
 * Layer an OR-of-contains filter onto an existing filter map so `_q=foo`
 * matches any searchable field. Returns a new filter object so callers can
 * pass it straight to `db.findMany({ filters })`.
 */
export function applyTextSearchFilter(
  existingFilters: Record<string, unknown> | undefined,
  attributes: Record<string, FieldConfig & { searchable?: boolean }>,
  query: string,
): Record<string, unknown> {
  const fields = resolveSearchFields(attributes);
  if (fields.length === 0 || !query) return existingFilters ?? {};
  const orClause = fields.map((field) => ({ [field]: { $contains: query } }));
  // Preserve existing $or filters by wrapping them in $and.
  const base = existingFilters ?? {};
  if (Object.keys(base).length === 0) {
    return { $or: orClause };
  }
  return { $and: [base, { $or: orClause }] };
}
