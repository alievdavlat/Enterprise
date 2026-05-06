/**
 * Services loader.
 *
 * Discovers `<projectRoot>/src/api/<name>/services/<name>.{ts,js}` (and any
 * sibling service files) and registers each with the ServiceRegistry under
 * the canonical UID `api::<api-name>.<service-name>`.
 *
 * Service file shape (default export):
 *
 *   export default ({ app }) => ({
 *     async findCustom(filters) { ... },
 *   });
 *
 * Or already-built object:
 *
 *   export default { findCustom: async () => [] };
 */

import path from "path";
import type { ServiceRegistry, Service } from "@enterprise/core";
import {
  importUserModule,
  isDirectory,
  safeReadDir,
} from "./loaderUtils";

export interface LoadedServices {
  registered: string[];
  skipped: string[];
}

async function buildService(filePath: string, app: unknown): Promise<Service | null> {
  try {
    const exported = await importUserModule(filePath);
    if (typeof exported === "function") {
      const result = await (exported as (ctx: { app: unknown }) => Service | Promise<Service>)({
        app,
      });
      return (result as Service) ?? null;
    }
    if (exported && typeof exported === "object") {
      return exported as Service;
    }
    return null;
  } catch (err) {
    console.warn(
      `[Enterprise:Services] Failed to import ${filePath}: ${(err as Error).message}`,
    );
    return null;
  }
}

export async function loadServicesFromPath(
  projectRoot: string,
  registry: ServiceRegistry,
  app: unknown,
): Promise<LoadedServices> {
  const out: LoadedServices = { registered: [], skipped: [] };
  const apiDir = path.join(projectRoot, "src", "api");
  if (!isDirectory(apiDir)) return out;

  for (const apiName of safeReadDir(apiDir)) {
    const apiPath = path.join(apiDir, apiName);
    if (!isDirectory(apiPath)) continue;
    const servicesDir = path.join(apiPath, "services");
    if (!isDirectory(servicesDir)) continue;
    for (const file of safeReadDir(servicesDir)) {
      const m = file.match(/^(.*?)\.(ts|js|mjs|cjs|tsx)$/);
      if (!m) continue;
      const serviceName = m[1];
      if (serviceName === "index") continue;
      const filePath = path.join(servicesDir, file);
      const service = await buildService(filePath, app);
      const uid = `api::${apiName}.${serviceName}`;
      if (service) {
        registry.register(uid, service);
        out.registered.push(uid);
      } else {
        out.skipped.push(uid);
      }
    }
  }

  return out;
}
