/**
 * Enterprise Plugin Registry
 * Manages registration, resolution, and lifecycle of all plugins
 */
export class PluginRegistry {
    constructor(app) {
        this.plugins = new Map();
        this.app = app;
    }
    /**
     * Register a plugin with the CMS
     */
    register(plugin) {
        if (this.plugins.has(plugin.name)) {
            console.warn(`[Enterprise] Plugin "${plugin.name}" is already registered. Skipping.`);
            return;
        }
        this.plugins.set(plugin.name, plugin);
        console.log(`[Enterprise] Plugin "${plugin.name}" registered.`);
    }
    /**
     * Get a registered plugin by name
     */
    get(name) {
        return this.plugins.get(name);
    }
    /**
     * Check if a plugin is registered
     */
    has(name) {
        return this.plugins.has(name);
    }
    /**
     * Get all registered plugins
     */
    getAll() {
        return Array.from(this.plugins.values());
    }
    /**
     * Run 'register' lifecycle on all plugins
     */
    async runRegister() {
        for (const plugin of this.plugins.values()) {
            if (plugin.register) {
                try {
                    await plugin.register(this.app);
                    console.log(`[Enterprise] Plugin "${plugin.name}" register() completed.`);
                }
                catch (err) {
                    console.error(`[Enterprise] Plugin "${plugin.name}" register() failed:`, err);
                    throw err;
                }
            }
        }
    }
    /**
     * Run 'bootstrap' lifecycle on all plugins
     */
    async runBootstrap() {
        for (const plugin of this.plugins.values()) {
            if (plugin.bootstrap) {
                try {
                    await plugin.bootstrap(this.app);
                    console.log(`[Enterprise] Plugin "${plugin.name}" bootstrap() completed.`);
                }
                catch (err) {
                    console.error(`[Enterprise] Plugin "${plugin.name}" bootstrap() failed:`, err);
                    throw err;
                }
            }
        }
    }
    /**
     * Run 'destroy' lifecycle on all plugins (on shutdown)
     */
    async runDestroy() {
        for (const plugin of this.plugins.values()) {
            if (plugin.destroy) {
                try {
                    await plugin.destroy();
                }
                catch (err) {
                    console.error(`[Enterprise] Plugin "${plugin.name}" destroy() failed:`, err);
                }
            }
        }
    }
}
// ---- Built-in Plugin Implementations ----
/** i18n Plugin */
export const i18nPlugin = {
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
export const uploadPlugin = {
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
export const usersPermissionsPlugin = {
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
export const emailPlugin = {
    name: "email",
    version: "1.0.0",
    description: "Email sending capabilities",
    register(app) {
        console.log("[Plugin:email] Registered");
    },
};
/** SEO Plugin */
export const seoPlugin = {
    name: "seo",
    version: "1.0.0",
    description: "SEO metadata management for content types",
    register(app) {
        console.log("[Plugin:seo] Registered");
    },
};
//# sourceMappingURL=PluginRegistry.js.map