import fs from "fs";
import path from "path";
import type { SchemaRegistry } from "@enterprise/core";
import { loadStrapiSchema, type StrapiSchemaJson } from "@enterprise/core";

/**
 * Find all schema.json under projectRoot/src/api/[api]/content-types/[name]/schema.json
 * and register them with the schema registry (Strapi v5 structure).
 */
export async function loadSchemasFromPath(
  projectRoot: string,
  schemaRegistry: SchemaRegistry,
): Promise<number> {
  const apiDir = path.join(projectRoot, "src", "api");
  if (!fs.existsSync(apiDir) || !fs.statSync(apiDir).isDirectory()) {
    return 0;
  }

  let count = 0;
  const apiNames = fs.readdirSync(apiDir);

  for (const apiName of apiNames) {
    const apiPath = path.join(apiDir, apiName);
    if (!fs.statSync(apiPath).isDirectory()) continue;

    const contentTypesDir = path.join(apiPath, "content-types");
    if (!fs.existsSync(contentTypesDir) || !fs.statSync(contentTypesDir).isDirectory()) {
      continue;
    }

    const contentTypeNames = fs.readdirSync(contentTypesDir);
    for (const contentTypeName of contentTypeNames) {
      const schemaPath = path.join(contentTypesDir, contentTypeName, "schema.json");
      if (!fs.existsSync(schemaPath)) continue;

      try {
        const raw = fs.readFileSync(schemaPath, "utf8");
        const strapiSchema: StrapiSchemaJson = JSON.parse(raw);
        const schema = loadStrapiSchema(strapiSchema, apiName, contentTypeName);
        if (schemaRegistry.has(schema.uid)) continue;
        schemaRegistry.register(schema);
        count++;
      } catch (err) {
        console.warn(
          `[Enterprise] Failed to load schema ${apiName}/${contentTypeName}:`,
          err,
        );
      }
    }
  }

  return count;
}
