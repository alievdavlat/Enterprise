export type FieldType =
  | "string"
  | "text"
  | "richtext"
  | "email"
  | "password"
  | "number"
  | "integer"
  | "biginteger"
  | "float"
  | "decimal"
  | "boolean"
  | "date"
  | "datetime"
  | "time"
  | "json"
  | "enumeration"
  | "media"
  | "relation"
  | "uid"
  | "component"
  | "dynamiczone";

export interface FieldSchema {
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  default?: unknown;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  regex?: string;
  enum?: string[];
  private?: boolean;
  pluginOptions?: Record<string, unknown>;
}

export interface ContentTypeSchema {
  kind: "collectionType" | "singleType";
  collectionName: string;
  info: {
    singularName: string;
    pluralName: string;
    displayName: string;
    description?: string;
  };
  options?: {
    draftAndPublish?: boolean;
    timestamps?: boolean;
  };
  pluginOptions?: Record<string, unknown>;
  attributes: Record<string, FieldSchema>;
}

export function generateApiRoutes(schema: ContentTypeSchema): string[] {
  const base = `/api/${schema.info.pluralName}`;
  const routes = [
    `GET    ${base}          → find (paginated, filtered)`,
    `POST   ${base}          → create`,
    `GET    ${base}/:id      → findOne`,
    `PUT    ${base}/:id      → update`,
    `DELETE ${base}/:id      → delete`,
  ];
  if (schema.options?.draftAndPublish) {
    routes.push(`POST   ${base}/:id/publish → publish`);
    routes.push(`POST   ${base}/:id/unpublish → unpublish`);
  }
  return routes;
}

export function validateSchema(schema: Partial<ContentTypeSchema>): string[] {
  const errors: string[] = [];
  if (!schema.info?.displayName) errors.push("displayName is required");
  if (!schema.info?.singularName) errors.push("singularName is required");
  if (!schema.info?.pluralName) errors.push("pluralName is required");
  if (!schema.kind) errors.push("kind must be collectionType or singleType");
  if (!schema.attributes || Object.keys(schema.attributes).length === 0) {
    errors.push("At least one attribute is required");
  }
  return errors;
}

export function schemaToTypeScript(schema: ContentTypeSchema): string {
  const typeMap: Record<string, string> = {
    string: "string",
    text: "string",
    richtext: "string",
    email: "string",
    password: "string",
    uid: "string",
    number: "number",
    integer: "number",
    biginteger: "bigint",
    float: "number",
    decimal: "number",
    boolean: "boolean",
    date: "string",
    datetime: "string",
    time: "string",
    json: "Record<string, unknown>",
    enumeration: "string",
    media: "{ url: string; alternativeText?: string; caption?: string; }",
    relation: "unknown",
    component: "unknown",
    dynamiczone: "unknown[]",
  };

  const fields = Object.entries(schema.attributes)
    .map(([name, field]) => {
      const tsType = typeMap[field.type] ?? "unknown";
      const optional = !field.required ? "?" : "";
      return `  ${name}${optional}: ${tsType};`;
    })
    .join("\n");

  return `export interface ${schema.info.displayName.replace(/\s+/g, "")} {\n  id: number;\n${fields}\n  createdAt: string;\n  updatedAt: string;\n${schema.options?.draftAndPublish ? "  publishedAt?: string;\n" : ""}}\n`;
}
