import type { Plugin } from "@enterprise/types";
import { EmailService } from "./EmailService";

/**
 * Built-in `email` plugin. Provides a real Nodemailer-backed service that loads
 * provider config from the core store at send time and renders templates from
 * `enterprise_email_templates`.
 *
 * Access from anywhere: `app.plugin('email').services.email` (an `EmailService`).
 */
export function createEmailPlugin(): Plugin {
  const plugin: Plugin & { services: { email?: EmailService } } = {
    name: "email",
    version: "1.0.0",
    description: "Email sending (Nodemailer) with provider config + templates",
    services: {},
    register(app) {
      const db = (app as { getDb?: unknown }).getDb;
      if (!db) {
        console.warn("[email] Skipping service registration: app.getDb not available");
        return;
      }
      const service = new EmailService({ db: db as never });
      plugin.services.email = service;
    },
  };
  return plugin;
}

export { EmailService };
export type { EmailProviderConfig } from "./EmailService";
