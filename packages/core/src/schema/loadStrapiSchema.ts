import type { ContentTypeSchema, FieldDefinition, FieldType } from "@enterprise/types";

/**
 * Strapi v5 schema.json shape (from src/api/[api]/content-types/[name]/schema.json)
 */
export interface StrapiSchemaJson {
  kind: "collectionType" | "singleType";
  collectionName: string;
  info?: {
    displayName?: string;
    singularName?: string;
    pluralName?: string;
    description?: string;
  };
  options?: {
    draftAndPublish?: boolean;
    timestamps?: boolean;
  };
  attributes: Record<
    string,
    {
      type: string;
      required?: boolean;
      unique?: boolean;
      default?: unknown;
      minLength?: number;
      maxLength?: number;
      min?: number;
      max?: number;
      enum?: string[];
      targetField?: string;
      relation?: string;
      target?: string;
      [key: string]: unknown;
    }
  >;
}

/**
 * Build uid like Strapi: api::apiName.contentTypeName
 */
export function buildContentTypeUid(apiName: string, contentTypeName: string): string {
  return `api::${apiName}.${contentTypeName}`;
}

/**
 * Build component uid like Strapi: <category>.<name> (e.g. `shared.hero`).
 */
export function buildComponentUid(category: string, name: string): string {
  return `${category}.${name}`;
}

/**
 * Strapi-style component schema. `src/components/<category>/<name>.json`.
 * Same attribute format as a content type but without `kind` / draftAndPublish.
 */
export interface StrapiComponentJson {
  collectionName?: string;
  info?: {
    displayName?: string;
    icon?: string;
    description?: string;
  };
  options?: Record<string, unknown>;
  attributes: StrapiSchemaJson["attributes"];
}

/**
 * Convert a Strapi-style component manifest into our ContentTypeSchema (with
 * `kind: "component"`). Table name follows the Strapi convention
 * `components_<category>_<name>` unless `collectionName` is set explicitly.
 */
export function loadStrapiComponent(
  manifest: StrapiComponentJson,
  category: string,
  name: string,
): ContentTypeSchema {
  const uid = buildComponentUid(category, name);
  const info = manifest.info || {};
  const attributes: Record<string, FieldDefinition> = {};

  for (const [attrName, attr] of Object.entries(manifest.attributes || {})) {
    const a = attr as StrapiSchemaJson["attributes"][string];
    attributes[attrName] = {
      name: attrName,
      type: toFieldType(a.type),
      required: a.required,
      unique: a.unique,
      default: a.default,
      minLength: a.minLength,
      maxLength: a.maxLength,
      min: a.min,
      max: a.max,
      enum: a.enum,
      relation: a.relation as FieldDefinition["relation"],
      target: a.target,
    };
  }

  const collectionName =
    manifest.collectionName ?? `components_${category}_${name}`;

  return {
    uid,
    kind: "component",
    collectionName,
    displayName: info.displayName || name,
    singularName: name,
    pluralName: `${name}s`,
    description: info.description,
    timestamps: true,
    category,
    attributes,
  };
}

/**
 * Map Strapi attribute type string to our FieldType
 */
function toFieldType(type: string): FieldType {
  const map: Record<string, FieldType> = {
    string: "string",
    text: "text",
    richtext: "richtext",
    integer: "integer",
    biginteger: "biginteger",
    float: "float",
    decimal: "decimal",
    boolean: "boolean",
    email: "email",
    password: "password",
    date: "date",
    datetime: "datetime",
    time: "time",
    json: "json",
    enumeration: "enumeration",
    media: "media",
    relation: "relation",
    uid: "uid",
    component: "component",
    dynamiczone: "dynamiczone",
  };
  return (map[type] as FieldType) || "string";
}

/**
 * Convert Strapi v5 schema.json to Enterprise ContentTypeSchema.
 * @param strapiSchema - Parsed schema.json object
 * @param apiName - API folder name (e.g. "article")
 * @param contentTypeName - Content-type folder name (e.g. "article")
 */
export function loadStrapiSchema(
  strapiSchema: StrapiSchemaJson,
  apiName: string,
  contentTypeName: string,
): ContentTypeSchema {
  const uid = buildContentTypeUid(apiName, contentTypeName);
  const info = strapiSchema.info || {};
  const options = strapiSchema.options || {};
  const attributes: Record<string, FieldDefinition> = {};

  for (const [name, attr] of Object.entries(strapiSchema.attributes || {})) {
    const a = attr as StrapiSchemaJson["attributes"][string];
    attributes[name] = {
      name,
      type: toFieldType(a.type),
      required: a.required,
      unique: a.unique,
      default: a.default,
      minLength: a.minLength,
      maxLength: a.maxLength,
      min: a.min,
      max: a.max,
      enum: a.enum,
      relation: a.relation as FieldDefinition["relation"],
      target: a.target,
    };
  }

  return {
    uid,
    kind: strapiSchema.kind,
    collectionName: strapiSchema.collectionName,
    displayName: info.displayName || contentTypeName,
    singularName: info.singularName || contentTypeName,
    pluralName: info.pluralName || `${contentTypeName}s`,
    description: info.description,
    draftAndPublish: options.draftAndPublish,
    timestamps: options.timestamps !== false,
    attributes,
  };
}
