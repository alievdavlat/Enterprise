import { ApolloServer } from "@apollo/server";
import type { IResolvers } from "@graphql-tools/utils";
import { gql } from "graphql-tag";
import type { SchemaRegistry } from "@enterprise/core";
import type { ContentTypeSchema } from "@enterprise/types";
import type { DatabaseAdapter } from "@enterprise/database";

function pascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

/** GraphQL names must match [_A-Za-z][_0-9A-Za-z]*. Prefix leading digits and replace invalid chars. */
function sanitizeGraphQLName(name: string): string {
  if (!name) return "_empty";
  let out = name.replace(/[^_A-Za-z0-9]/g, "_");
  if (/^\d/.test(out)) out = "_" + out;
  return out || "_empty";
}

function generateGraphQLSchema(schemas: ContentTypeSchema[]): string {
  const types: string[] = [];
  const queries: string[] = ["  _empty: Boolean"];
  const mutations: string[] = ["  _empty: Boolean"];

  for (const schema of schemas) {
    const typeName = sanitizeGraphQLName(pascalCase(schema.displayName));
    const fields: string[] = [
      "  id: ID",
      "  documentId: String",
      "  createdAt: String",
      "  updatedAt: String",
    ];

    for (const [name, field] of Object.entries(schema.attributes)) {
      const gqlName = sanitizeGraphQLName(name);
      const gqlType = mapToGraphQLType(field.type, name);
      if (gqlType) {
        fields.push(`  ${gqlName}: ${field.required ? `${gqlType}!` : gqlType}`);
      }
    }

    // Response type
    types.push(`type ${typeName} {\n${fields.join("\n")}\n}`);
    types.push(
      `type ${typeName}Response {\n  data: [${typeName}]\n  meta: Meta\n}`,
    );
    types.push(
      `input ${typeName}Input {\n${Object.entries(schema.attributes)
        .map(([name, f]) => `  ${sanitizeGraphQLName(name)}: ${mapToGraphQLType(f.type, name)}`)
        .join("\n")}\n}`,
    );

    if (schema.kind === "collectionType" || schema.kind === "component" || schema.kind === "dynamiczone") {
      const p = sanitizeGraphQLName(schema.pluralName);
      queries.push(
        `  ${p}(filters: JSON, sort: String, pagination: PaginationInput): ${typeName}Response`,
      );
      const singularQuery = schema.singularName !== schema.pluralName
        ? sanitizeGraphQLName(schema.singularName)
        : sanitizeGraphQLName(schema.singularName) + "ById";
      queries.push(`  ${singularQuery}(id: ID!): ${typeName}`);
      mutations.push(
        `  create${typeName}(data: ${typeName}Input!): ${typeName}`,
      );
      mutations.push(
        `  update${typeName}(id: ID!, data: ${typeName}Input!): ${typeName}`,
      );
      mutations.push(`  delete${typeName}(id: ID!): ${typeName}`);
    }
  }

  return `
    scalar JSON
    
    type Meta {
      pagination: Pagination
    }
    
    type Pagination {
      page: Int
      pageSize: Int
      pageCount: Int
      total: Int
    }
    
    input PaginationInput {
      page: Int
      pageSize: Int
      start: Int
      limit: Int
    }
    
    ${types.join("\n\n")}
    
    type Query {
${queries.join("\n")}
    }
    
    type Mutation {
${mutations.join("\n")}
    }
  `;
}

function mapToGraphQLType(fieldType: string, fieldName: string): string {
  const map: Record<string, string> = {
    string: "String",
    text: "String",
    richtext: "String",
    integer: "Int",
    biginteger: "String",
    float: "Float",
    decimal: "Float",
    boolean: "Boolean",
    email: "String",
    password: "String",
    date: "String",
    datetime: "String",
    time: "String",
    json: "JSON",
    uid: "String",
    enumeration: "String",
    media: "JSON",
    relation: "JSON",
    component: "JSON",
    dynamiczone: "JSON",
  };
  return map[fieldType] || "String";
}

function generateDocumentId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 24; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

interface GqlFieldConfig {
  type?: string;
  required?: boolean;
  unique?: boolean;
  maxLength?: number;
  minLength?: number;
  regex?: string;
  default?: unknown;
  private?: boolean;
  enum?: string[];
}

function gqlValidateAndApplyDefaults(
  data: Record<string, unknown>,
  attributes: Record<string, GqlFieldConfig>,
  isUpdate: boolean,
): { data: Record<string, unknown>; errors: string[] } {
  const errors: string[] = [];
  const result = { ...data };
  for (const [field, config] of Object.entries(attributes)) {
    const value = result[field];
    const isEmpty = value === undefined || value === null || value === "";
    if (!isUpdate && isEmpty && config.default !== undefined) { result[field] = config.default; continue; }
    if (config.required && isEmpty && !isUpdate) { errors.push(`"${field}" is required`); continue; }
    if (isEmpty) continue;
    const strVal = typeof value === "string" ? value : undefined;
    if (strVal !== undefined && config.maxLength && strVal.length > config.maxLength) errors.push(`"${field}" exceeds maximum length of ${config.maxLength}`);
    if (strVal !== undefined && config.minLength && strVal.length < config.minLength) errors.push(`"${field}" is shorter than minimum length of ${config.minLength}`);
    if (strVal !== undefined && config.regex) { try { if (!new RegExp(config.regex).test(strVal)) errors.push(`"${field}" does not match pattern ${config.regex}`); } catch {} }
    if (config.type === "enumeration" && Array.isArray(config.enum) && strVal !== undefined && !config.enum.includes(strVal)) errors.push(`"${field}" must be one of: ${config.enum.join(", ")}`);
  }
  return { data: result, errors };
}

function gqlStripPrivateFields(row: Record<string, unknown>, attributes: Record<string, GqlFieldConfig>): Record<string, unknown> {
  const result = { ...row };
  for (const [field, config] of Object.entries(attributes)) {
    if (config.private) delete result[field];
  }
  return result;
}

/** Map GraphQL input keys (sanitized names) back to original attribute names. */
function mapInputToAttrNames(
  data: Record<string, unknown>,
  attributes: Record<string, GqlFieldConfig>,
): Record<string, unknown> {
  const result = { ...data };
  for (const attrName of Object.keys(attributes)) {
    const gqlName = sanitizeGraphQLName(attrName);
    if (gqlName !== attrName && result[gqlName] !== undefined) {
      result[attrName] = result[gqlName];
      delete result[gqlName];
    }
  }
  return result;
}

/** Map row attribute keys to sanitized GraphQL names for response. */
function mapRowToGqlNames(
  row: Record<string, unknown>,
  attributes: Record<string, GqlFieldConfig>,
): Record<string, unknown> {
  const result = { ...row };
  for (const attrName of Object.keys(attributes)) {
    const gqlName = sanitizeGraphQLName(attrName);
    if (gqlName !== attrName && result[attrName] !== undefined) {
      result[gqlName] = result[attrName];
      delete result[attrName];
    }
  }
  return result;
}

function generateResolvers(
  schemas: ContentTypeSchema[],
  db: DatabaseAdapter,
): Record<string, unknown> {
  const queryResolvers: Record<string, unknown> = { _empty: () => true };
  const mutationResolvers: Record<string, unknown> = { _empty: () => true };

  for (const schema of schemas) {
    const typeName = sanitizeGraphQLName(pascalCase(schema.displayName));
    const attrs = (schema.attributes || {}) as Record<string, GqlFieldConfig>;

    if (schema.kind === "collectionType" || schema.kind === "component" || schema.kind === "dynamiczone") {
      const pluralKey = sanitizeGraphQLName(schema.pluralName);
      queryResolvers[pluralKey] = async (
        _: unknown,
        { filters, sort, pagination }: Record<string, unknown>,
      ) => {
        const result = await db.findMany(schema.collectionName, {
          filters,
          sort,
          pagination,
        } as any);
        return {
          ...result,
          data: result.data.map((row: Record<string, unknown>) =>
            mapRowToGqlNames(gqlStripPrivateFields(row, attrs), attrs),
          ),
        };
      };
      const singularKey =
        schema.singularName !== schema.pluralName
          ? sanitizeGraphQLName(schema.singularName)
          : sanitizeGraphQLName(schema.singularName) + "ById";
      queryResolvers[singularKey] = async (
        _: unknown,
        { id }: { id: string },
      ) => {
        const row = await db.findOne(schema.collectionName, id);
        return row
          ? mapRowToGqlNames(gqlStripPrivateFields(row, attrs), attrs)
          : null;
      };
      mutationResolvers[`create${typeName}`] = async (
        _: unknown,
        { data }: { data: Record<string, unknown> },
      ) => {
        const dataWithAttrNames = mapInputToAttrNames(data, attrs);
        const { data: validatedData, errors } = gqlValidateAndApplyDefaults(dataWithAttrNames, attrs, false);
        if (errors.length > 0) throw new Error(`Validation error: ${errors.join("; ")}`);
        for (const [field, config] of Object.entries(attrs)) {
          if (!config.unique) continue;
          const v = validatedData[field];
          if (v === undefined || v === null || v === "") continue;
          const existing = await db.findOneBy(schema.collectionName, { [field]: v });
          if (existing) throw new Error(`"${field}" must be unique — value "${v}" already exists`);
        }
        const created = await db.create(schema.collectionName, {
          ...validatedData,
          documentId: generateDocumentId(),
        });
        return mapRowToGqlNames(gqlStripPrivateFields(created, attrs), attrs);
      };
      mutationResolvers[`update${typeName}`] = async (
        _: unknown,
        { id, data }: { id: string; data: Record<string, unknown> },
      ) => {
        const dataWithAttrNames = mapInputToAttrNames(data, attrs);
        const { data: validatedData, errors } = gqlValidateAndApplyDefaults(dataWithAttrNames, attrs, true);
        if (errors.length > 0) throw new Error(`Validation error: ${errors.join("; ")}`);
        for (const [field, config] of Object.entries(attrs)) {
          if (!config.unique) continue;
          const v = validatedData[field];
          if (v === undefined || v === null || v === "") continue;
          const existing = await db.findOneBy(schema.collectionName, { [field]: v });
          if (existing && String((existing as any).id ?? (existing as any).documentId) !== String(id)) {
            throw new Error(`"${field}" must be unique — value "${v}" already exists`);
          }
        }
        const updated = await db.update(schema.collectionName, id, validatedData);
        return mapRowToGqlNames(gqlStripPrivateFields(updated, attrs), attrs);
      };
      mutationResolvers[`delete${typeName}`] = async (
        _: unknown,
        { id }: { id: string },
      ) => {
        const deleted = await db.delete(schema.collectionName, id);
        return mapRowToGqlNames(gqlStripPrivateFields(deleted, attrs), attrs);
      };
    }
  }

  return {
    Query: queryResolvers,
    Mutation: mutationResolvers,
  };
}

export async function createGraphQLServer(
  schemaRegistry: SchemaRegistry,
  db: DatabaseAdapter,
): Promise<{ server: ApolloServer; schema: string }> {
  const schemas = schemaRegistry.getAll();
  const typeDefs = generateGraphQLSchema(schemas);
  const resolvers = generateResolvers(schemas, db);

  const server = new ApolloServer({
    typeDefs: gql`
      ${typeDefs}
    `,
    resolvers: resolvers as IResolvers,
  });

  return { server, schema: typeDefs };
}
