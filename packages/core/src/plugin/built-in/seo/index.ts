import type { Plugin } from "@enterprise/types";
import { SeoService } from "./SeoService";

/**
 * Built-in `seo` plugin. Exposes a `SeoService` for sitemap generation and
 * SEO metadata extraction from entry rows.
 *
 * Access: `app.plugin('seo').services.seo` (a `SeoService`).
 */
export function createSeoPlugin(config?: { siteUrl?: string }): Plugin {
  const plugin: Plugin & { services: { seo?: SeoService } } = {
    name: "seo",
    version: "1.0.0",
    description: "SEO helpers: sitemap.xml generation and metadata extraction",
    services: {},
    register(app) {
      const db = (app as { getDb?: unknown }).getDb;
      const schemaRegistry = (app as { getSchemaRegistry?: unknown }).getSchemaRegistry;
      if (!db || !schemaRegistry) {
        console.warn("[seo] Skipping service registration: app.getDb or app.getSchemaRegistry not available");
        return;
      }
      plugin.services.seo = new SeoService({
        db: db as never,
        schemaRegistry: schemaRegistry as never,
        siteUrl: config?.siteUrl,
      });
    },
  };
  return plugin;
}

export { SeoService };
export type { SeoComponent } from "./SeoService";
