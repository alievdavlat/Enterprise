/**
 * Enterprise Service Registry.
 *
 * Strapi v5 style: each content type can ship a service module with custom
 * methods. Loaders (`packages/backends/express/src/loaders/loadServicesFromPath`)
 * scan `src/api/<name>/services/<name>.ts`, call its default-export factory and
 * register the result here. Plugins or routes can then call:
 *
 *     app.service('api::article.article').myCustomMethod()
 */

export type Service = Record<string, unknown> & {
  [method: string]: unknown;
};

export type ServiceFactory = (app: unknown) => Service | Promise<Service>;

export class ServiceRegistry {
  private services: Map<string, Service> = new Map();

  register(uid: string, service: Service): void {
    if (this.services.has(uid)) {
      console.warn(
        `[Enterprise:Services] Service "${uid}" already registered – overwriting.`,
      );
    }
    this.services.set(uid, service);
  }

  get(uid: string): Service | undefined {
    return this.services.get(uid);
  }

  has(uid: string): boolean {
    return this.services.has(uid);
  }

  list(): string[] {
    return Array.from(this.services.keys());
  }

  delete(uid: string): boolean {
    return this.services.delete(uid);
  }
}
