import type { HookEvent, HookContext } from "@enterprise/types";

type LifecycleHandler = (ctx: HookContext) => Promise<unknown> | unknown;

/**
 * Enterprise Lifecycle Manager (server-side).
 * Strapi-style lifecycle hooks: beforeCreate, afterCreate, etc.
 * Lives in core/src/lifecycle to avoid confusion with packages/hooks (React hooks).
 */
export class LifecycleManager {
  private handlers: Map<string, LifecycleHandler[]> = new Map();

  on(event: HookEvent, handler: LifecycleHandler): void {
    const list = this.handlers.get(event) || [];
    list.push(handler);
    this.handlers.set(event, list);
  }

  off(event: HookEvent, handler: LifecycleHandler): void {
    const list = this.handlers.get(event) || [];
    const i = list.indexOf(handler);
    if (i !== -1) {
      list.splice(i, 1);
      this.handlers.set(event, list);
    }
  }

  once(event: HookEvent, handler: LifecycleHandler): void {
    const wrapper: LifecycleHandler = async (ctx) => {
      this.off(event, wrapper);
      return handler(ctx);
    };
    this.on(event, wrapper);
  }

  async run(event: HookEvent, ctx: HookContext): Promise<HookContext> {
    const list = this.handlers.get(event) || [];
    let currentCtx = { ...ctx };
    for (const handler of list) {
      const result = await handler(currentCtx);
      if (result !== undefined) {
        currentCtx = { ...currentCtx, result };
      }
    }
    return currentCtx;
  }

  hasHandlers(event: HookEvent): boolean {
    const list = this.handlers.get(event);
    return !!list && list.length > 0;
  }

  getRegisteredEvents(): string[] {
    return Array.from(this.handlers.keys());
  }

  clear(event?: HookEvent): void {
    if (event) this.handlers.delete(event);
    else this.handlers.clear();
  }
}

/**
 * Model-scoped lifecycle hooks (convenience wrapper).
 */
export class ModelLifecycles {
  private manager: LifecycleManager;
  private model: string;

  constructor(model: string, manager: LifecycleManager) {
    this.model = model;
    this.manager = manager;
  }

  beforeCreate(handler: LifecycleHandler) {
    this.manager.on("beforeCreate", handler);
  }
  afterCreate(handler: LifecycleHandler) {
    this.manager.on("afterCreate", handler);
  }
  beforeFindOne(handler: LifecycleHandler) {
    this.manager.on("beforeFindOne", handler);
  }
  afterFindOne(handler: LifecycleHandler) {
    this.manager.on("afterFindOne", handler);
  }
  beforeFindMany(handler: LifecycleHandler) {
    this.manager.on("beforeFindMany", handler);
  }
  afterFindMany(handler: LifecycleHandler) {
    this.manager.on("afterFindMany", handler);
  }
  beforeUpdate(handler: LifecycleHandler) {
    this.manager.on("beforeUpdate", handler);
  }
  afterUpdate(handler: LifecycleHandler) {
    this.manager.on("afterUpdate", handler);
  }
  beforeDelete(handler: LifecycleHandler) {
    this.manager.on("beforeDelete", handler);
  }
  afterDelete(handler: LifecycleHandler) {
    this.manager.on("afterDelete", handler);
  }
  beforeCount(handler: LifecycleHandler) {
    this.manager.on("beforeCount", handler);
  }
  afterCount(handler: LifecycleHandler) {
    this.manager.on("afterCount", handler);
  }
}
