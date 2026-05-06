/**
 * Cron loader.
 *
 * Reads `<projectRoot>/config/cron.{ts,js}` (object map or array) AND any
 * standalone files under `<projectRoot>/src/cron/<name>.{ts,js}` and registers
 * them with the CronManager. The manager is started by the server.
 *
 * Config formats supported:
 *
 *   // Map style
 *   export default {
 *     cleanupTokens: { schedule: '0 * * * *', task: async ({ app }) => { ... } },
 *   };
 *
 *   // Array style
 *   export default [
 *     { name: 'cleanupTokens', schedule: '0 * * * *', task: async () => { ... } },
 *   ];
 *
 *   // Function returning either of the above (for app/strapi-style access)
 *   export default ({ app }) => ({ ... });
 */

import path from "path";
import type { CronManager } from "@enterprise/core";
import {
  findModuleFile,
  importUserModule,
  isDirectory,
  safeReadDir,
} from "./loaderUtils";

type RawCron = {
  schedule: string;
  task?: (ctx: { app: unknown }) => void | Promise<void>;
  handler?: (ctx: { app: unknown }) => void | Promise<void>;
  enabled?: boolean;
  timezone?: string;
};

type RawConfig = Record<string, RawCron> | (RawCron & { name: string })[];

async function loadConfigFile(projectRoot: string): Promise<RawConfig | null> {
  const cfgBase = path.join(projectRoot, "config", "cron");
  const cfgFile = findModuleFile(cfgBase);
  if (!cfgFile) return null;
  try {
    const exported = await importUserModule(cfgFile);
    const value =
      typeof exported === "function" ? await (exported as () => unknown)() : exported;
    if (Array.isArray(value) || (value && typeof value === "object")) {
      return value as RawConfig;
    }
    return null;
  } catch (err) {
    console.warn(
      `[Enterprise:Cron] Could not load ${cfgFile}: ${(err as Error).message}`,
    );
    return null;
  }
}

function pickHandler(c: RawCron): ((ctx: { app: unknown }) => void | Promise<void>) | null {
  return c.task ?? c.handler ?? null;
}

export interface LoadedCron {
  registered: string[];
  skipped: string[];
}

export async function loadCronFromPath(
  projectRoot: string,
  manager: CronManager,
  app: unknown,
): Promise<LoadedCron> {
  const out: LoadedCron = { registered: [], skipped: [] };

  const cfg = await loadConfigFile(projectRoot);
  if (cfg) {
    if (Array.isArray(cfg)) {
      for (const job of cfg) {
        const handler = pickHandler(job);
        if (!job.name || !job.schedule || !handler) {
          out.skipped.push(job.name || "(unnamed)");
          continue;
        }
        manager.add({
          name: job.name,
          schedule: job.schedule,
          handler: () => handler({ app }),
          enabled: job.enabled,
          timezone: job.timezone,
        });
        out.registered.push(job.name);
      }
    } else {
      for (const [name, job] of Object.entries(cfg)) {
        const handler = pickHandler(job);
        if (!job.schedule || !handler) {
          out.skipped.push(name);
          continue;
        }
        manager.add({
          name,
          schedule: job.schedule,
          handler: () => handler({ app }),
          enabled: job.enabled,
          timezone: job.timezone,
        });
        out.registered.push(name);
      }
    }
  }

  // Standalone files under src/cron/
  const cronDir = path.join(projectRoot, "src", "cron");
  if (isDirectory(cronDir)) {
    for (const file of safeReadDir(cronDir)) {
      const m = file.match(/^(.*?)\.(ts|js|mjs|cjs|tsx)$/);
      if (!m) continue;
      const name = m[1];
      const filePath = path.join(cronDir, file);
      try {
        const exported = await importUserModule(filePath);
        const value =
          typeof exported === "function"
            ? await (exported as (ctx: { app: unknown }) => unknown)({ app })
            : exported;
        if (!value || typeof value !== "object") {
          out.skipped.push(name);
          continue;
        }
        const job = value as RawCron;
        const handler = pickHandler(job);
        if (!job.schedule || !handler) {
          out.skipped.push(name);
          continue;
        }
        manager.add({
          name,
          schedule: job.schedule,
          handler: () => handler({ app }),
          enabled: job.enabled,
          timezone: job.timezone,
        });
        out.registered.push(name);
      } catch (err) {
        console.warn(
          `[Enterprise:Cron] Failed to load ${filePath}: ${(err as Error).message}`,
        );
        out.skipped.push(name);
      }
    }
  }

  return out;
}
