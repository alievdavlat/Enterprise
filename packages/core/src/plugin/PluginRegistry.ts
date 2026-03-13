import type { Plugin, EnterpriseApp } from "@enterprise/types";

/**
 * Enterprise Plugin Registry
 * Manages registration, resolution, and lifecycle of all plugins
 */
export class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();
  private app: EnterpriseApp;

  constructor(app: EnterpriseApp) {
    this.app = app;
  }

  /**
   * Register a plugin with the CMS
   */
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

  /**
   * Get a registered plugin by name
   */
  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Check if a plugin is registered
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Get all registered plugins
   */
  getAll(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Run 'register' lifecycle on all plugins
   */
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

  /**
   * Run 'bootstrap' lifecycle on all plugins
   */
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

  /**
   * Run 'destroy' lifecycle on all plugins (on shutdown)
   */
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

// ---- Built-in Plugin Implementations ----

/** i18n Plugin */
export const i18nPlugin: Plugin = {
  name: "i18n",
  version: "1.0.0",
  description: "Internationalization support for content types",
  register(app) {
    console.log("[Plugin:i18n] Registered");
  },
  bootstrap(app) {
    console.log("[Plugin:i18n] Bootstrapped");
  },
};

/** Upload Plugin */
export const uploadPlugin: Plugin = {
  name: "upload",
  version: "1.0.0",
  description: "Media library and file upload management",
  register(app) {
    console.log("[Plugin:upload] Registered");
  },
  bootstrap(app) {
    console.log("[Plugin:upload] Bootstrapped - Media library ready");
  },
};

/** Users-Permissions Plugin */
export const usersPermissionsPlugin: Plugin = {
  name: "users-permissions",
  version: "1.0.0",
  description: "User registration, authentication, and permissions",
  register(app) {
    console.log("[Plugin:users-permissions] Registered");
  },
  bootstrap(app) {
    console.log("[Plugin:users-permissions] Bootstrapped");
  },
};

/** Email Plugin */
export const emailPlugin: Plugin = {
  name: "email",
  version: "1.0.0",
  description: "Email sending capabilities",
  register(app) {
    console.log("[Plugin:email] Registered");
  },
};

/** SEO Plugin */
export const seoPlugin: Plugin = {
  name: "seo",
  version: "1.0.0",
  description: "SEO metadata management for content types",
  register(app) {
    console.log("[Plugin:seo] Registered");
  },
};
