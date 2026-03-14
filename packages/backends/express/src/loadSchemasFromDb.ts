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

/** Add missing columns to an existing table when schema has new attributes */
async function addMissingColumns(
  db: DatabaseAdapter,
  schema: ContentTypeSchema,
): Promise<void> {
  if (!db.getTableColumns || !db.addColumnIfNotExists) return;
  const existing = await db.getTableColumns(schema.collectionName);
  const attrs = schema.attributes || {};
  for (const [name, field] of Object.entries(attrs)) {
    if (existing.includes(name)) continue;
    const f = field as { type?: string; required?: boolean; maxLength?: number };
    const colType = FIELD_TO_COL[f.type || "string"] || "string";
    await db.addColumnIfNotExists(schema.collectionName, name, colType, {
      nullable: !f.required,
      length: f.maxLength,
    });
  }
}

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

    // Auto-fix common pluralName issues (e.g., "userss" → "users")
    let needsDbUpdate = false;
    if (schema.pluralName && schema.pluralName.endsWith("ss") && !schema.singularName?.endsWith("ss")) {
      schema.pluralName = schema.pluralName.slice(0, -1);
      schema.collectionName = schema.pluralName;
      needsDbUpdate = true;
    }

    try {
      if (needsDbUpdate) {
        const dbRow = await db.findOneBy(SCHEMAS_TABLE, { uid });
        if (dbRow) {
          await db.update(SCHEMAS_TABLE, (dbRow as { id: number }).id, {
            schema: JSON.stringify(schema),
          });
          console.log(`[Enterprise] Auto-fixed pluralName for "${uid}" → "${schema.pluralName}"`);
        }
      }
      schemaRegistry.register(schema);
      if (!(await db.tableExists(schema.collectionName))) {
        const attributeColumns = Object.entries(schema.attributes || {}).map(
          ([name, field]) => {
            const f = field as { type?: string; required?: boolean; maxLength?: number; unique?: boolean; default?: unknown };
            return {
              name,
              type: FIELD_TO_COL[f.type || "string"] || "string",
              nullable: !f.required,
              length: f.maxLength,
              unique: f.unique || false,
              default: f.default,
            };
          },
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
      } else if (db.getTableColumns && db.addColumnIfNotExists) {
        await addMissingColumns(db, schema);
      }
      count++;
    } catch (err) {
      console.warn(`[Enterprise] Failed to load schema from DB ${uid}:`, err);
    }
  }
  return count;
}

/**
 * Persist all schemas from the registry into the DB (e.g. after first-boot load from schema/ files).
 */
export async function persistRegistryToDb(
  db: DatabaseAdapter,
  schemaRegistry: SchemaRegistry,
): Promise<number> {
  const schemas = schemaRegistry.getAll();
  let count = 0;
  for (const schema of schemas) {
    const schemaStr = JSON.stringify(schema);
    const existing = await db.findOneBy(SCHEMAS_TABLE, { uid: schema.uid });
    if (existing) {
      await db.update(SCHEMAS_TABLE, (existing as { id: number }).id, { schema: schemaStr });
    } else {
      await db.create(SCHEMAS_TABLE, { uid: schema.uid, schema: schemaStr });
      count++;
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
  const exists = await db.tableExists(schema.collectionName);
  if (exists) {
    if (db.getTableColumns && db.addColumnIfNotExists) {
      await addMissingColumns(db, schema);
    }
    return;
  }
  const attributeColumns = Object.entries(schema.attributes || {}).map(
    ([name, field]) => {
      const f = field as { type?: string; required?: boolean; maxLength?: number; unique?: boolean; default?: unknown };
      return {
        name,
        type: FIELD_TO_COL[f.type || "string"] || "string",
        nullable: !f.required,
        length: f.maxLength,
        unique: f.unique || false,
        default: f.default,
      };
    },
  );
  await db.createTable(schema.collectionName, {
    columns: [
      { name: "documentId", type: "string", length: 24, unique: true, nullable: false },
      ...attributeColumns,
    ],
    timestamps: schema.timestamps !== false,
  });
}
