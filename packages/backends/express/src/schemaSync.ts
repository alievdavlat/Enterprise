import fs from "fs";
import path from "path";
import type { ContentTypeSchema } from "@enterprise/types";

const SCHEMA_DIR_NAME = "schema";
const CONTENT_TYPES_DIR = "content-types";
const COMPONENTS_DIR = "components";

/**
 * Convert schema UID to a safe filename (e.g. api::article.article -> api__article.article.json).
 */
export function uidToFilename(uid: string): string {
  return uid.replace(/::/g, "__").replace(/\//g, "_") + ".json";
}

/**
 * Get schema directory for content-types or components.
 */
function getSchemaSubDir(projectRoot: string, kind: "content-types" | "components"): string {
  return path.join(projectRoot, SCHEMA_DIR_NAME, kind === "content-types" ? CONTENT_TYPES_DIR : COMPONENTS_DIR);
}

/**
 * Write a content-type or component schema to the project's schema/ folder.
 * Enables "schema as code": commit these files and deploy; server can load them on first boot.
 */
export function syncSchemaToFile(schema: ContentTypeSchema, projectRoot: string): void {
  const isComponent = schema.kind === "component";
  const dir = getSchemaSubDir(projectRoot, isComponent ? "components" : "content-types");
  const filePath = path.join(dir, uidToFilename(schema.uid));

  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const payload = JSON.stringify(schema, null, 2);
    fs.writeFileSync(filePath, payload, "utf8");
  } catch (err) {
    console.warn(`[Enterprise] Could not write schema to file ${filePath}:`, err);
  }
}

/**
 * Remove schema file when a content-type or component is deleted.
 */
export function deleteSchemaFile(uid: string, projectRoot: string): void {
  const isComponent = uid.startsWith("component::");
  const dir = getSchemaSubDir(projectRoot, isComponent ? "components" : "content-types");
  const filePath = path.join(dir, uidToFilename(uid));
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn(`[Enterprise] Could not delete schema file ${filePath}:`, err);
  }
}

/**
 * Return the schema directory path (for export/import docs and first-boot seed).
 */
export function getSchemaDir(projectRoot: string): string {
  return path.join(projectRoot, SCHEMA_DIR_NAME);
}
