import path from "path";
import { pathToFileURL } from "url";
import fs from "fs";

/**
 * Dynamically import a TypeScript or JavaScript file at a path. Works under
 * `tsx` / `ts-node-dev` (where .ts files are loadable) and against compiled
 * `dist/` output. We try a few common extensions in order of preference.
 *
 * Returns the module's default export when present, otherwise the namespace.
 */
export async function importUserModule(filePath: string): Promise<unknown> {
  const url = pathToFileURL(filePath).href;
  const mod: Record<string, unknown> = (await import(url)) as Record<string, unknown>;
  if (mod && typeof mod === "object" && "default" in mod && mod.default !== undefined) {
    return mod.default;
  }
  return mod;
}

const CANDIDATE_EXTS = [".ts", ".js", ".mjs", ".cjs", ".tsx"];

export function findModuleFile(baseNoExt: string): string | null {
  for (const ext of CANDIDATE_EXTS) {
    const p = baseNoExt + ext;
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export function findModuleInDir(dir: string, basename: string): string | null {
  for (const ext of CANDIDATE_EXTS) {
    const p = path.join(dir, basename + ext);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export function safeReadDir(dir: string): string[] {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

export function isDirectory(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}
