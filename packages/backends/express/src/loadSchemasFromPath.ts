import fs from "fs";
import path from "path";
import type { SchemaRegistry } from "@enterprise/core";
import { loadStrapiSchema, type StrapiSchemaJson } from "@enterprise/core";
import type { ContentTypeSchema } from "@enterprise/types";

/**
 * Load from project schema/ folder (Enterprise native: content-types/*.json, components/*.json).
 * Each file is a full ContentTypeSchema JSON. Enables schema-as-code and first-boot seed.
 */
function loadFromSchemaDir(
  projectRoot: string,
  schemaRegistry: SchemaRegistry,
): number {
  const schemaDir = path.join(projectRoot, "schema");
  if (!fs.existsSync(schemaDir) || !fs.statSync(schemaDir).isDirectory()) return 0;

  let count = 0;
  for (const sub of ["content-types", "components"]) {
    const dir = path.join(schemaDir, sub);
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        const raw = fs.readFileSync(filePath, "utf8");
        const schema = JSON.parse(raw) as ContentTypeSchema;
        if (!schema?.uid || schemaRegistry.has(schema.uid)) continue;
        schemaRegistry.register(schema);
        count++;
      } catch (err) {
        console.warn(`[Enterprise] Failed to load schema from ${filePath}:`, err);
      }
    }
  }
  return count;
}

/**
 * Find all schema.json under projectRoot/src/api/[api]/content-types/[name]/schema.json
 */
function loadFromStrapiApiDir(
  projectRoot: string,
  schemaRegistry: SchemaRegistry,
): number {
  const apiDir = path.join(projectRoot, "src", "api");
  if (!fs.existsSync(apiDir) || !fs.statSync(apiDir).isDirectory()) return 0;

  let count = 0;
  const apiNames = fs.readdirSync(apiDir);
  for (const apiName of apiNames) {
    const apiPath = path.join(apiDir, apiName);
    if (!fs.statSync(apiPath).isDirectory()) continue;
    const contentTypesDir = path.join(apiPath, "content-types");
    if (!fs.existsSync(contentTypesDir) || !fs.statSync(contentTypesDir).isDirectory()) continue;
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
        console.warn(`[Enterprise] Failed to load schema ${apiName}/${contentTypeName}:`, err);
      }
    }
  }
  return count;
}

/**
 * Load schemas from project: first schema/ (Enterprise native), then src/api (Strapi layout).
 */
export async function loadSchemasFromPath(
  projectRoot: string,
  schemaRegistry: SchemaRegistry,
): Promise<number> {
  const fromSchemaDir = loadFromSchemaDir(projectRoot, schemaRegistry);
  const fromStrapi = loadFromStrapiApiDir(projectRoot, schemaRegistry);
  return fromSchemaDir + fromStrapi;
}
