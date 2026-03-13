import type { MiddlewareFn } from "@enterprise/types";

/**
 * Enterprise Middleware Manager
 * Compose and execute middleware chains like Koa/Express
 */
export class MiddlewareManager<TContext = unknown> {
  private middlewares: { name: string; fn: MiddlewareFn<TContext> }[] = [];

  /**
   * Add a middleware to the chain
   */
  use(name: string, fn: MiddlewareFn<TContext>): void {
    this.middlewares.push({ name, fn });
  }

  /**
   * Remove a middleware by name
   */
  remove(name: string): void {
    const index = this.middlewares.findIndex((m) => m.name === name);
    if (index !== -1) this.middlewares.splice(index, 1);
  }

  /**
   * Execute the middleware chain for a given context
   */
  async execute(ctx: TContext): Promise<void> {
    let index = -1;

    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) throw new Error("next() called multiple times");
      index = i;
      const middleware = this.middlewares[i];
      if (!middleware) return;
      await middleware.fn(ctx, () => dispatch(i + 1));
    };

    await dispatch(0);
  }

  /**
   * Compose middlewares into a single function
   */
  compose(): (ctx: TContext, next?: () => Promise<void>) => Promise<void> {
    const fns = this.middlewares.map((m) => m.fn);
    return async (ctx: TContext, next?: () => Promise<void>): Promise<void> => {
      let index = -1;

      const dispatch = async (i: number): Promise<void> => {
        if (i <= index) throw new Error("next() called multiple times");
        index = i;
        let fn: MiddlewareFn<TContext> | undefined = fns[i];
        if (i === fns.length) fn = next;
        if (!fn) return;
        await fn(ctx, () => dispatch(i + 1));
      };

      await dispatch(0);
    };
  }

  /**
   * List all registered middlewares
   */
  list(): string[] {
    return this.middlewares.map((m) => m.name);
  }
}

// ---- Built-in Middlewares ----

/**
 * Request logging middleware
 */
export function createLoggerMiddleware<
  TContext extends { method?: string; url?: string; status?: number },
>(): MiddlewareFn<TContext> {
  return async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(
      `[Enterprise] ${ctx.method || "REQ"} ${ctx.url || ""} - ${ctx.status || 200} (${ms}ms)`,
    );
  };
}

/**
 * Rate limiting middleware (simple in-memory)
 */
export function createRateLimitMiddleware<
  TContext extends { ip?: string; status?: number; body?: unknown },
>(options: { max?: number; windowMs?: number } = {}): MiddlewareFn<TContext> {
  const { max = 100, windowMs = 60000 } = options;
  const requests = new Map<string, { count: number; resetAt: number }>();

  return async (ctx, next) => {
    const key = ctx.ip || "unknown";
    const now = Date.now();
    const entry = requests.get(key);

    if (!entry || now > entry.resetAt) {
      requests.set(key, { count: 1, resetAt: now + windowMs });
      await next();
    } else if (entry.count < max) {
      entry.count++;
      await next();
    } else {
      ctx.status = 429;
      ctx.body = {
        error: {
          status: 429,
          name: "TooManyRequests",
          message: "Rate limit exceeded",
        },
      };
    }
  };
}

/**
 * CORS middleware
 */
export function createCorsMiddleware<
  TContext extends { set?: (key: string, value: string) => void },
>(
  options: { origin?: string | string[]; credentials?: boolean } = {},
): MiddlewareFn<TContext> {
  const { origin = "*", credentials = true } = options;

  return async (ctx, next) => {
    const originHeader = Array.isArray(origin) ? origin[0] : origin;
    if (ctx.set) {
      ctx.set("Access-Control-Allow-Origin", originHeader);
      ctx.set(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      );
      ctx.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
      if (credentials) ctx.set("Access-Control-Allow-Credentials", "true");
    }
    await next();
  };
}

/**
 * Body size limit middleware
 */
export function createBodySizeLimitMiddleware<
  TContext extends {
    request?: { length?: number };
    status?: number;
    body?: unknown;
  },
>(
  limit = 1024 * 1024 * 10, // 10MB
): MiddlewareFn<TContext> {
  return async (ctx, next) => {
    const size = ctx.request?.length || 0;
    if (size > limit) {
      ctx.status = 413;
      ctx.body = {
        error: {
          status: 413,
          name: "PayloadTooLarge",
          message: "Request body too large",
        },
      };
      return;
    }
    await next();
  };
}
