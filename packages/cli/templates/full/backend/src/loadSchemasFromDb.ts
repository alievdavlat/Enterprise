import type { SchemaRegistry } from "@enterprise/core";
import type { DatabaseAdapter } from "@enterprise/database";
import type { ContentTypeSchema } from "@enterprise/types";

const SCHEMAS_TABLE = "enterprise_content_type_schemas";

type ColType = "string" | "text" | "integer" | "bigint" | "float" | "decimal" | "boolean" | "date" | "datetime" | "json" | "uuid";
const FIELD_TO_COL: Record<string, ColType> = {
  string: "string", text: "text", richtext: "text", integer: "integer", biginteger: "bigint",
  float: "float", decimal: "decimal", boolean: "boolean", email: "string", password: "string",
  date: "date", datetime: "datetime", time: "string", json: "json", uid: "uuid",
  enumeration: "string", media: "json", relation: "integer", component: "json", dynamiczone: "json",
};

/**
 * Load all content type schemas from DB and register them.
 * Ensures each schema's data table exists (auto-create if missing).
 */
export async function loadSchemasFromDb(
  db: DatabaseAdapter,
  schemaRegistry: SchemaRegistry,
): Promise<number> {
  const result = await db.findMany(SCHEMAS_TABLE, {
    pagination: { page: 1, pageSize: 500 },
  });
  let count = 0;
  for (const row of result.data) {
    const raw = row as { uid?: string; schema?: string | ContentTypeSchema };
    const uid = raw.uid;
    let schema: ContentTypeSchema;
    if (typeof raw.schema === "string") {
      try {
        schema = JSON.parse(raw.schema);
      } catch {
        continue;
      }
    } else if (raw.schema && typeof raw.schema === "object") {
      schema = raw.schema as ContentTypeSchema;
    } else {
      continue;
    }
    if (!uid || !schema.uid) continue;
    try {
      schemaRegistry.register(schema);
      if (!(await db.tableExists(schema.collectionName))) {
        const attributeColumns = Object.entries(schema.attributes || {}).map(
          ([name, field]) => ({
            name,
            type: FIELD_TO_COL[(field as { type?: string }).type || "string"] || "string",
            nullable: !(field as { required?: boolean }).required,
            length: (field as { maxLength?: number }).maxLength,
          }),
        );
        await db.createTable(schema.collectionName, {
          columns: [
            {
              name: "documentId",
              type: "string",
              length: 24,
              unique: true,
              nullable: false,
            },
            ...attributeColumns,
          ],
          timestamps: schema.timestamps !== false,
        });
      }
      count++;
    } catch (err) {
      console.warn(`[Enterprise] Failed to load schema from DB ${uid}:`, err);
    }
  }
  return count;
}

/**
 * Ensure the data table for a content type schema exists; create if missing.
 * Used after loading schemas from files so DB and file-based schemas both have tables.
 */
export async function ensureTableForSchema(
  db: DatabaseAdapter,
  schema: ContentTypeSchema,
): Promise<void> {
  if (await db.tableExists(schema.collectionName)) return;
  const attributeColumns = Object.entries(schema.attributes || {}).map(
    ([name, field]) => ({
      name,
      type: FIELD_TO_COL[(field as { type?: string }).type || "string"] || "string",
      nullable: !(field as { required?: boolean }).required,
      length: (field as { maxLength?: number }).maxLength,
    }),
  );
  await db.createTable(schema.collectionName, {
    columns: [
      { name: "documentId", type: "string", length: 24, unique: true, nullable: false },
      ...attributeColumns,
    ],
    timestamps: schema.timestamps !== false,
  });
}
