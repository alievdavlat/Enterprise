/**
 * Build OpenAPI 3 spec from SchemaRegistry (Strapi-style).
 * Backend can expose GET /api/openapi.json using this.
 */

import type { SchemaRegistry } from "../schema/SchemaRegistry";
import type { ContentTypeSchema } from "@enterprise/types";

export interface OpenApiOptions {
  title?: string;
  version?: string;
  basePath?: string;
}

export function buildOpenApiSpec(
  schemaRegistry: SchemaRegistry,
  options: OpenApiOptions = {},
): Record<string, unknown> {
  const { title = "Enterprise CMS API", version = "1.0.0", basePath = "/api" } = options;
  const schemas: Record<string, unknown> = {};
  const paths: Record<string, unknown> = {};

  for (const schema of schemaRegistry.getAll()) {
    const uid = schema.uid;
    const tag = schema.displayName || uid;
    const collectionName = schema.collectionName;

    schemas[tag] = contentTypeToJsonSchema(schema);

    const pathPrefix = `${basePath}/${collectionName}`;
    paths[pathPrefix] = {
      get: {
        tags: [tag],
        summary: `List ${schema.pluralName}`,
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 25 } },
        ],
        responses: { "200": { description: "OK" } },
      },
      post: {
        tags: [tag],
        summary: `Create ${schema.singularName}`,
        requestBody: { content: { "application/json": { schema: { $ref: `#/components/schemas/${tag}` } } } },
        responses: { "201": { description: "Created" } },
      },
    };
    paths[`${pathPrefix}/{documentId}`] = {
      get: { tags: [tag], summary: `Get ${schema.singularName} by documentId`, responses: { "200": { description: "OK" } } },
      put: { tags: [tag], summary: `Update ${schema.singularName}`, responses: { "200": { description: "OK" } } },
      delete: { tags: [tag], summary: `Delete ${schema.singularName}`, responses: { "200": { description: "OK" } } },
    };
  }

  return {
    openapi: "3.0.0",
    info: { title, version },
    paths,
    components: { schemas },
  };
}

function contentTypeToJsonSchema(schema: ContentTypeSchema): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const [key, def] of Object.entries(schema.attributes)) {
    props[def.name] = fieldToJsonSchema(def);
  }
  if (schema.timestamps !== false) {
    props.createdAt = { type: "string", format: "date-time" };
    props.updatedAt = { type: "string", format: "date-time" };
  }
  return { type: "object", properties: props };
}

function fieldToJsonSchema(field: { type: string; required?: boolean }): Record<string, unknown> {
  const types: Record<string, Record<string, unknown>> = {
    string: { type: "string" },
    text: { type: "string" },
    richtext: { type: "string" },
    integer: { type: "integer" },
    float: { type: "number" },
    boolean: { type: "boolean" },
    json: { type: "object" },
    date: { type: "string", format: "date" },
    datetime: { type: "string", format: "date-time" },
    media: { type: "object" },
    relation: { type: "object" },
    uid: { type: "string" },
  };
  const schema = types[field.type] ?? { type: "string" };
  return field.required ? { ...schema, nullable: false } : schema;
}
