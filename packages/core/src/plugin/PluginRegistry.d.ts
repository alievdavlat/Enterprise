import type { Plugin, EnterpriseApp } from "@enterprise/types";
/**
 * Enterprise Plugin Registry
 * Manages registration, resolution, and lifecycle of all plugins
 */
export declare class PluginRegistry {
    private plugins;
    private app;
    constructor(app: EnterpriseApp);
    /**
     * Register a plugin with the CMS
     */
    register(plugin: Plugin): void;
    /**
     * Get a registered plugin by name
     */
    get(name: string): Plugin | undefined;
    /**
     * Check if a plugin is registered
     */
    has(name: string): boolean;
    /**
     * Get all registered plugins
     */
    getAll(): Plugin[];
    /**
     * Run 'register' lifecycle on all plugins
     */
    runRegister(): Promise<void>;
    /**
     * Run 'bootstrap' lifecycle on all plugins
     */
    runBootstrap(): Promise<void>;
    /**
     * Run 'destroy' lifecycle on all plugins (on shutdown)
     */
    runDestroy(): Promise<void>;
}
/** i18n Plugin */
export declare const i18nPlugin: Plugin;
/** Upload Plugin */
export declare const uploadPlugin: Plugin;
/** Users-Permissions Plugin */
export declare const usersPermissionsPlugin: Plugin;
/** Email Plugin */
export declare const emailPlugin: Plugin;
/** SEO Plugin */
export declare const seoPlugin: Plugin;
//# sourceMappingURL=PluginRegistry.d.ts.map