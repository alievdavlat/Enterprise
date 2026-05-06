/**
 * Lifecycles loader.
 *
 * Discovers
 * `<projectRoot>/src/api/<api>/content-types/<name>/lifecycles.{ts,js}`
 * and registers each exported hook with the LifecycleManager scoped to that
 * model. The handler receives `(ctx)` where ctx includes the data, params,
 * and (after-hooks) the result.
 *
 * Lifecycles file shape:
 *
 *   export default {
 *     async beforeCreate(ctx) { ... },
 *     async afterCreate(ctx)  { ... },
 *   };
 *
 * The loader wraps each handler so it only fires for the matching model
 * (so an article lifecycles file does not run on category creates).
 */

import path from "path";
import type { LifecycleManager, SchemaRegistry } from "@enterprise/core";
import {
  importUserModule,
  isDirectory,
  findModuleInDir,
  safeReadDir,
} from "./loaderUtils";

const LIFECYCLE_EVENTS = [
  "beforeCreate",
  "afterCreate",
  "beforeFindOne",
  "afterFindOne",
  "beforeFindMany",
  "afterFindMany",
  "beforeUpdate",
  "afterUpdate",
  "beforeDelete",
  "afterDelete",
  "beforeCount",
  "afterCount",
] as const;

type LifecycleEvent = (typeof LIFECYCLE_EVENTS)[number];

export interface LoadedLifecycles {
  registered: { uid: string; events: string[] }[];
}

export async function loadLifecyclesFromPath(
  projectRoot: string,
  manager: LifecycleManager,
  schemaRegistry: SchemaRegistry,
): Promise<LoadedLifecycles> {
  const out: LoadedLifecycles = { registered: [] };
  const apiDir = path.join(projectRoot, "src", "api");
  if (!isDirectory(apiDir)) return out;

  for (const apiName of safeReadDir(apiDir)) {
    const ctsDir = path.join(apiDir, apiName, "content-types");
    if (!isDirectory(ctsDir)) continue;
    for (const ctName of safeReadDir(ctsDir)) {
      const ctDir = path.join(ctsDir, ctName);
      if (!isDirectory(ctDir)) continue;
      const file = findModuleInDir(ctDir, "lifecycles");
      if (!file) continue;
      let exported: unknown;
      try {
        exported = await importUserModule(file);
      } catch (err) {
        console.warn(
          `[Enterprise:Lifecycles] Failed to import ${file}: ${(err as Error).message}`,
        );
        continue;
      }
      if (!exported || typeof exported !== "object") continue;
      const handlers = exported as Record<string, unknown>;
      const targetUid = `api::${apiName}.${ctName}`;
      // Resolve to the schema's actual UID even if folder names differ.
      const schema = schemaRegistry.get(targetUid);
      const matchUid = schema?.uid ?? targetUid;

      const registeredEvents: string[] = [];
      for (const evt of LIFECYCLE_EVENTS) {
        const fn = handlers[evt];
        if (typeof fn !== "function") continue;
        manager.on(evt as LifecycleEvent, async (ctx) => {
          if (ctx.model !== matchUid) return undefined;
          return await (fn as (c: unknown) => unknown | Promise<unknown>)(ctx);
        });
        registeredEvents.push(evt);
      }
      if (registeredEvents.length > 0) {
        out.registered.push({ uid: matchUid, events: registeredEvents });
      }
    }
  }

  return out;
}
