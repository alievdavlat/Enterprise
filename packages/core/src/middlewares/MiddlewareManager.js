/**
 * Enterprise Middleware Manager
 * Compose and execute middleware chains like Koa/Express
 */
export class MiddlewareManager {
    constructor() {
        this.middlewares = [];
    }
    /**
     * Add a middleware to the chain
     */
    use(name, fn) {
        this.middlewares.push({ name, fn });
    }
    /**
     * Remove a middleware by name
     */
    remove(name) {
        const index = this.middlewares.findIndex((m) => m.name === name);
        if (index !== -1)
            this.middlewares.splice(index, 1);
    }
    /**
     * Execute the middleware chain for a given context
     */
    async execute(ctx) {
        let index = -1;
        const dispatch = async (i) => {
            if (i <= index)
                throw new Error("next() called multiple times");
            index = i;
            const middleware = this.middlewares[i];
            if (!middleware)
                return;
            await middleware.fn(ctx, () => dispatch(i + 1));
        };
        await dispatch(0);
    }
    /**
     * Compose middlewares into a single function
     */
    compose() {
        const fns = this.middlewares.map((m) => m.fn);
        return async (ctx, next) => {
            let index = -1;
            const dispatch = async (i) => {
                if (i <= index)
                    throw new Error("next() called multiple times");
                index = i;
                let fn = fns[i];
                if (i === fns.length)
                    fn = next;
                if (!fn)
                    return;
                await fn(ctx, () => dispatch(i + 1));
            };
            await dispatch(0);
        };
    }
    /**
     * List all registered middlewares
     */
    list() {
        return this.middlewares.map((m) => m.name);
    }
}
// ---- Built-in Middlewares ----
/**
 * Request logging middleware
 */
export function createLoggerMiddleware() {
    return async (ctx, next) => {
        const start = Date.now();
        await next();
        const ms = Date.now() - start;
        console.log(`[Enterprise] ${ctx.method || "REQ"} ${ctx.url || ""} - ${ctx.status || 200} (${ms}ms)`);
    };
}
/**
 * Rate limiting middleware (simple in-memory)
 */
export function createRateLimitMiddleware(options = {}) {
    const { max = 100, windowMs = 60000 } = options;
    const requests = new Map();
    return async (ctx, next) => {
        const key = ctx.ip || "unknown";
        const now = Date.now();
        const entry = requests.get(key);
        if (!entry || now > entry.resetAt) {
            requests.set(key, { count: 1, resetAt: now + windowMs });
            await next();
        }
        else if (entry.count < max) {
            entry.count++;
            await next();
        }
        else {
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
export function createCorsMiddleware(options = {}) {
    const { origin = "*", credentials = true } = options;
    return async (ctx, next) => {
        const originHeader = Array.isArray(origin) ? origin[0] : origin;
        if (ctx.set) {
            ctx.set("Access-Control-Allow-Origin", originHeader);
            ctx.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
            ctx.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
            if (credentials)
                ctx.set("Access-Control-Allow-Credentials", "true");
        }
        await next();
    };
}
/**
 * Body size limit middleware
 */
export function createBodySizeLimitMiddleware(limit = 1024 * 1024 * 10) {
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
//# sourceMappingURL=MiddlewareManager.js.map