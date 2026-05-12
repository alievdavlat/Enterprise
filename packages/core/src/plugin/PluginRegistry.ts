import type { Plugin, EnterpriseApp } from "@enterprise/types";

/**
 * Enterprise Plugin Registry
 * Manages registration, resolution, and lifecycle of all plugins.
 */
export class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();
  private app: EnterpriseApp;

  constructor(app: EnterpriseApp) {
    this.app = app;
  }

  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(
        `[Enterprise] Plugin "${plugin.name}" is already registered. Skipping.`,
      );
      return;
    }
    this.plugins.set(plugin.name, plugin);
    console.log(`[Enterprise] Plugin "${plugin.name}" registered.`);
  }

  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  has(name: string): boolean {
    return this.plugins.has(name);
  }

  getAll(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  async runRegister(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin.register) {
        try {
          await plugin.register(this.app);
          console.log(
            `[Enterprise] Plugin "${plugin.name}" register() completed.`,
          );
        } catch (err) {
          console.error(
            `[Enterprise] Plugin "${plugin.name}" register() failed:`,
            err,
          );
          throw err;
        }
      }
    }
  }

  async runBootstrap(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin.bootstrap) {
        try {
          await plugin.bootstrap(this.app);
          console.log(
            `[Enterprise] Plugin "${plugin.name}" bootstrap() completed.`,
          );
        } catch (err) {
          console.error(
            `[Enterprise] Plugin "${plugin.name}" bootstrap() failed:`,
            err,
          );
          throw err;
        }
      }
    }
  }

  async runDestroy(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin.destroy) {
        try {
          await plugin.destroy();
        } catch (err) {
          console.error(
            `[Enterprise] Plugin "${plugin.name}" destroy() failed:`,
            err,
          );
        }
      }
    }
  }
}

// ---- Built-in plugin factories (real implementations live in ./built-in/*) ----

export { createEmailPlugin } from "./built-in/email";
export { createI18nPlugin } from "./built-in/i18n";
export { createUploadPlugin } from "./built-in/upload";
export { createUsersPermissionsPlugin } from "./built-in/users-permissions";
export { createSeoPlugin } from "./built-in/seo";

// ---- Back-compat shims (deprecated; prefer the create* factories) ----

import { createEmailPlugin as _email } from "./built-in/email";
import { createI18nPlugin as _i18n } from "./built-in/i18n";
import { createUploadPlugin as _upload } from "./built-in/upload";
import { createUsersPermissionsPlugin as _users } from "./built-in/users-permissions";
import { createSeoPlugin as _seo } from "./built-in/seo";

/** @deprecated Use `createEmailPlugin()` from `@enterprise/core`. */
export const emailPlugin: Plugin = _email();
/** @deprecated Use `createI18nPlugin()` from `@enterprise/core`. */
export const i18nPlugin: Plugin = _i18n();
/** @deprecated Use `createUploadPlugin()` from `@enterprise/core`. */
export const uploadPlugin: Plugin = _upload();
/** @deprecated Use `createUsersPermissionsPlugin()` from `@enterprise/core`. */
export const usersPermissionsPlugin: Plugin = _users();
/** @deprecated Use `createSeoPlugin()` from `@enterprise/core`. */
export const seoPlugin: Plugin = _seo();
