import type { Plugin } from "@enterprise/types";
import { LocaleService } from "./LocaleService";

/**
 * Built-in `i18n` plugin. Exposes a `LocaleService` cached locale lookup so
 * routes/middleware don't hit the DB on every request.
 *
 * Access: `app.plugin('i18n').services.locale` (a `LocaleService`).
 */
export function createI18nPlugin(): Plugin {
  const plugin: Plugin & { services: { locale?: LocaleService } } = {
    name: "i18n",
    version: "1.0.0",
    description: "Internationalization — locales + resolution",
    services: {},
    register(app) {
      const db = (app as { getDb?: unknown }).getDb;
      if (!db) {
        console.warn("[i18n] Skipping service registration: app.getDb not available");
        return;
      }
      plugin.services.locale = new LocaleService({ db: db as never });
    },
  };
  return plugin;
}

export { LocaleService };
export type { Locale } from "./LocaleService";
