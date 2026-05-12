import type { Plugin } from "@enterprise/types";
import { AuthService, type AuthConfig } from "./AuthService";

/**
 * Built-in `users-permissions` plugin. Provides an `AuthService` covering
 * register / login / change-password / password-reset / email-confirmation
 * against `enterprise_users`. Existing express auth routes already implement
 * the HTTP surface; this gives plugins and lifecycles a programmatic API.
 *
 * Access: `app.plugin('users-permissions').services.auth` (an `AuthService`).
 */
export function createUsersPermissionsPlugin(config?: AuthConfig): Plugin {
  const plugin: Plugin & { services: { auth?: AuthService } } = {
    name: "users-permissions",
    version: "1.0.0",
    description: "User registration, authentication, password reset, email confirmation",
    services: {},
    register(app) {
      const db = (app as { getDb?: unknown }).getDb;
      if (!db) {
        console.warn("[users-permissions] Skipping service registration: app.getDb not available");
        return;
      }
      plugin.services.auth = new AuthService({ db: db as never, config });
    },
  };
  return plugin;
}

export { AuthService };
export type { AuthUser, AuthConfig } from "./AuthService";
