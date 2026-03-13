import type { MiddlewareFn } from "@enterprise/types";
/**
 * Enterprise Middleware Manager
 * Compose and execute middleware chains like Koa/Express
 */
export declare class MiddlewareManager<TContext = unknown> {
    private middlewares;
    /**
     * Add a middleware to the chain
     */
    use(name: string, fn: MiddlewareFn<TContext>): void;
    /**
     * Remove a middleware by name
     */
    remove(name: string): void;
    /**
     * Execute the middleware chain for a given context
     */
    execute(ctx: TContext): Promise<void>;
    /**
     * Compose middlewares into a single function
     */
    compose(): (ctx: TContext, next?: () => Promise<void>) => Promise<void>;
    /**
     * List all registered middlewares
     */
    list(): string[];
}
/**
 * Request logging middleware
 */
export declare function createLoggerMiddleware<TContext extends {
    method?: string;
    url?: string;
    status?: number;
}>(): MiddlewareFn<TContext>;
/**
 * Rate limiting middleware (simple in-memory)
 */
export declare function createRateLimitMiddleware<TContext extends {
    ip?: string;
    status?: number;
    body?: unknown;
}>(options?: {
    max?: number;
    windowMs?: number;
}): MiddlewareFn<TContext>;
/**
 * CORS middleware
 */
export declare function createCorsMiddleware<TContext extends {
    set?: (key: string, value: string) => void;
}>(options?: {
    origin?: string | string[];
    credentials?: boolean;
}): MiddlewareFn<TContext>;
/**
 * Body size limit middleware
 */
export declare function createBodySizeLimitMiddleware<TContext extends {
    request?: {
        length?: number;
    };
    status?: number;
    body?: unknown;
}>(limit?: number): MiddlewareFn<TContext>;
//# sourceMappingURL=MiddlewareManager.d.ts.map