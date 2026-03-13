import { ApolloServer } from "@apollo/server";
import type { IResolvers } from "@graphql-tools/utils";
import { gql } from "graphql-tag";
import type { SchemaRegistry } from "@enterprise/core";
import type { ContentTypeSchema } from "@enterprise/types";
import type { DatabaseAdapter } from "@enterprise/database";

function generateGraphQLSchema(schemas: ContentTypeSchema[]): string {
  const types: string[] = [];
  const queries: string[] = ["  _empty: Boolean"];
  const mutations: string[] = ["  _empty: Boolean"];

  for (const schema of schemas) {
    const typeName = schema.displayName.replace(/\s+/g, "");
    const fields: string[] = [
      "  id: ID",
      "  createdAt: String",
      "  updatedAt: String",
    ];

    for (const [name, field] of Object.entries(schema.attributes)) {
      const gqlType = mapToGraphQLType(field.type, name);
      if (gqlType) {
        fields.push(`  ${name}: ${field.required ? `${gqlType}!` : gqlType}`);
      }
    }

    // Response type
    types.push(`type ${typeName} {\n${fields.join("\n")}\n}`);
    types.push(
      `type ${typeName}Response {\n  data: [${typeName}]\n  meta: Meta\n}`,
    );
    types.push(
      `input ${typeName}Input {\n${Object.entries(schema.attributes)
        .map(([name, f]) => `  ${name}: ${mapToGraphQLType(f.type, name)}`)
        .join("\n")}\n}`,
    );

    if (schema.kind === "collectionType") {
      const p = schema.pluralName;
      queries.push(
        `  ${p}(filters: JSON, sort: String, pagination: PaginationInput): ${typeName}Response`,
      );
      queries.push(`  ${schema.singularName}(id: ID!): ${typeName}`);
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

function generateResolvers(
  schemas: ContentTypeSchema[],
  db: DatabaseAdapter,
): Record<string, unknown> {
  const queryResolvers: Record<string, unknown> = { _empty: () => true };
  const mutationResolvers: Record<string, unknown> = { _empty: () => true };

  for (const schema of schemas) {
    const typeName = schema.displayName.replace(/\s+/g, "");

    if (schema.kind === "collectionType") {
      // findMany
      queryResolvers[schema.pluralName] = async (
        _: unknown,
        { filters, sort, pagination }: Record<string, unknown>,
      ) => {
        return db.findMany(schema.collectionName, {
          filters,
          sort,
          pagination,
        } as any);
      };
      // findOne
      queryResolvers[schema.singularName] = async (
        _: unknown,
        { id }: { id: string },
      ) => {
        return db.findOne(schema.collectionName, id);
      };
      // create
      mutationResolvers[`create${typeName}`] = async (
        _: unknown,
        { data }: { data: Record<string, unknown> },
      ) => {
        return db.create(schema.collectionName, data);
      };
      // update
      mutationResolvers[`update${typeName}`] = async (
        _: unknown,
        { id, data }: { id: string; data: Record<string, unknown> },
      ) => {
        return db.update(schema.collectionName, id, data);
      };
      // delete
      mutationResolvers[`delete${typeName}`] = async (
        _: unknown,
        { id }: { id: string },
      ) => {
        return db.delete(schema.collectionName, id);
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
