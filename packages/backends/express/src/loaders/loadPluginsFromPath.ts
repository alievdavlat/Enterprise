/**
 * Plugin loader.
 *
 * Discovers user plugins under `<projectRoot>/src/plugins/<name>/index.{ts,js}`
 * and merges enable/disable + config from `<projectRoot>/config/plugins.{ts,js}`.
 *
 * Plugin file shape (default export):
 *
 *   export default {
 *     name: 'my-plugin',
 *     version: '1.0.0',
 *     register(app) { ... },
 *     bootstrap(app) { ... },
 *     destroy() { ... },
 *   }
 *
 * Or a factory:
 *
 *   export default ({ app }) => ({ name: 'my-plugin', ... })
 */

import path from "path";
import type { PluginRegistry } from "@enterprise/core";
import type { Plugin } from "@enterprise/types";
import {
  importUserModule,
  isDirectory,
  findModuleInDir,
  findModuleFile,
  safeReadDir,
} from "./loaderUtils";

type PluginsConfig = Record<
  string,
  { enabled?: boolean; config?: Record<string, unknown>; resolve?: string } | boolean
>;

async function loadPluginsConfig(projectRoot: string): Promise<PluginsConfig> {
  const cfgBase = path.join(projectRoot, "config", "plugins");
  const cfgFile = findModuleFile(cfgBase);
  if (!cfgFile) return {};
  try {
    const exported = await importUserModule(cfgFile);
    if (typeof exported === "function") {
      const result = await (exported as () => PluginsConfig | Promise<PluginsConfig>)();
      return result || {};
    }
    return (exported as PluginsConfig) || {};
  } catch (err) {
    console.warn(
      `[Enterprise:Plugins] Could not load ${cfgFile}: ${(err as Error).message}`,
    );
    return {};
  }
}

async function loadPluginModule(filePath: string, app: unknown): Promise<Plugin | null> {
  try {
    const mod = await importUserModule(filePath);
    if (!mod) return null;
    let plugin: unknown = mod;
    if (typeof mod === "function") {
      plugin = await (mod as (app: unknown) => unknown)(app);
    }
    if (
      plugin &&
      typeof plugin === "object" &&
      typeof (plugin as Plugin).name === "string"
    ) {
      return plugin as Plugin;
    }
    return null;
  } catch (err) {
    console.warn(
      `[Enterprise:Plugins] Failed to import ${filePath}: ${(err as Error).message}`,
    );
    return null;
  }
}

export interface LoadedPlugins {
  registered: string[];
  disabled: string[];
}

/**
 * Discover and register plugins. Run plugin lifecycles `register` then
 * `bootstrap` on the registry afterwards (caller's job — kept separate so
 * core plugins can be added before lifecycles run).
 */
export async function loadPluginsFromPath(
  projectRoot: string,
  registry: PluginRegistry,
  app: unknown,
): Promise<LoadedPlugins> {
  const result: LoadedPlugins = { registered: [], disabled: [] };
  const cfg = await loadPluginsConfig(projectRoot);

  // Discovery from src/plugins/<name>/{index,strapi-server}.ts
  const pluginsDir = path.join(projectRoot, "src", "plugins");
  if (isDirectory(pluginsDir)) {
    for (const entry of safeReadDir(pluginsDir)) {
      const dir = path.join(pluginsDir, entry);
      if (!isDirectory(dir)) continue;
      const file =
        findModuleInDir(dir, "index") ?? findModuleInDir(dir, "strapi-server");
      if (!file) continue;
      const plugin = await loadPluginModule(file, app);
      if (!plugin) continue;
      const meta = cfg[plugin.name] ?? cfg[entry];
      const enabled =
        meta === undefined
          ? true
          : typeof meta === "boolean"
            ? meta
            : meta.enabled !== false;
      if (!enabled) {
        result.disabled.push(plugin.name);
        continue;
      }
      registry.register(plugin);
      result.registered.push(plugin.name);
    }
  }

  // Also allow declaring third-party plugins via config (resolve: 'pkg-name')
  for (const [name, meta] of Object.entries(cfg)) {
    if (registry.has(name)) continue;
    if (typeof meta !== "object" || !meta) continue;
    if (meta.enabled === false) {
      result.disabled.push(name);
      continue;
    }
    if (!meta.resolve) continue;
    try {
      const mod = (await import(meta.resolve)) as Record<string, unknown>;
      const exported = (mod.default ?? mod) as unknown;
      let plugin: unknown = exported;
      if (typeof exported === "function") {
        plugin = await (exported as (app: unknown) => unknown)(app);
      }
      if (
        plugin &&
        typeof plugin === "object" &&
        typeof (plugin as Plugin).name === "string"
      ) {
        registry.register(plugin as Plugin);
        result.registered.push((plugin as Plugin).name);
      }
    } catch (err) {
      console.warn(
        `[Enterprise:Plugins] Could not resolve "${name}" from "${meta.resolve}": ${(err as Error).message}`,
      );
    }
  }

  return result;
}
