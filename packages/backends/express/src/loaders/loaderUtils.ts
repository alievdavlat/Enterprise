import path from "path";
import { pathToFileURL } from "url";
import fs from "fs";
import { createRequire } from "module";

// A require() bound to this module so it shares the global module system,
// including any compiler hook (ts-node / ts-node-dev) registered on
// `require.extensions` for `.ts` / `.tsx` files.
const requireFromHere = createRequire(__filename);

const pickExport = (mod: Record<string, unknown>): unknown => {
  if (mod && typeof mod === "object" && "default" in mod && mod.default !== undefined) {
    return mod.default;
  }
  return mod;
};

/**
 * Dynamically import a TypeScript or JavaScript file at a path. Works under
 * `tsx` / `ts-node-dev` (where .ts files are loadable) and against compiled
 * `dist/` output.
 *
 * NOTE: ESM `import()` of a `file://…/foo.ts` URL is NOT intercepted by the
 * ts-node / ts-node-dev compiler (they hook CommonJS `require`, not the ESM
 * loader), so it throws "Cannot find module". We therefore prefer `require()`
 * for everything except genuine ESM (`.mjs`), and fall back to dynamic
 * `import()` only when `require()` is unavailable or fails.
 *
 * Returns the module's default export when present, otherwise the namespace.
 */
export async function importUserModule(filePath: string): Promise<unknown> {
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== ".mjs") {
    try {
      return pickExport(requireFromHere(filePath) as Record<string, unknown>);
    } catch (requireErr) {
      // require() is the correct loader here; a failure usually means a real
      // error inside the module (e.g. a TS syntax error). Try dynamic import()
      // as a fallback for genuine ESM, but if that also fails surface the
      // ORIGINAL require() error — import() of a file://….ts URL throws a
      // misleading "Cannot find module" that would otherwise mask the real cause.
      try {
        const url = pathToFileURL(filePath).href;
        return pickExport((await import(url)) as Record<string, unknown>);
      } catch {
        throw requireErr;
      }
    }
  }
  const url = pathToFileURL(filePath).href;
  return pickExport((await import(url)) as Record<string, unknown>);
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
