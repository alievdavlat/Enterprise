/**
 * Middleware loader.
 *
 * Reads `<projectRoot>/config/middlewares.{ts,js}` (an ordered list) and
 * resolves each entry to an Express middleware:
 *
 *   - `"enterprise::<name>"` → built-in middleware factory (logger, cors,
 *     security, body, query, errors, …)
 *   - `"global::<name>"` → user middleware in `src/middlewares/<name>.{ts,js}`
 *   - object form `{ name, config? }` for either kind
 *
 * The loader returns an ordered array of `(req, res, next)` Express handlers.
 * The server applies them after security/CORS bootstrap and before the API
 * routers.
 */

import path from "path";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import {
  findModuleFile,
  importUserModule,
  isDirectory,
  findModuleInDir,
  safeReadDir,
} from "./loaderUtils";

type MiddlewareEntry =
  | string
  | {
      name: string;
      config?: Record<string, unknown>;
      resolve?: string;
      enabled?: boolean;
    };

type MiddlewareFactory = (
  config?: Record<string, unknown>,
  app?: unknown,
) => RequestHandler | Promise<RequestHandler>;

const BUILTINS: Record<string, MiddlewareFactory> = {
  logger: () => (req: Request, _res: Response, next: NextFunction) => {
    console.log(`[Enterprise] ${req.method} ${req.url}`);
    next();
  },
  poweredBy: () => (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Powered-By", "Enterprise CMS");
    next();
  },
  errors: () =>
    function errorMiddleware(
      err: unknown,
      _req: Request,
      res: Response,
      next: NextFunction,
    ) {
      if (!err) return next();
      const e = err as { status?: number; statusCode?: number; message?: string };
      const status = e.status || e.statusCode || 500;
      console.error("[Enterprise:Errors]", err);
      if (res.headersSent) return next(err);
      res.status(status).json({
        error: { status, message: e.message || "Internal Server Error" },
      });
    } as unknown as RequestHandler,
  // Pass-throughs that the bootstrap middleware (helmet/cors/compression/json)
  // already provides — kept here so config files using their names don't fail.
  cors: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  security: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  body: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  query: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  compression: () => (_req: Request, _res: Response, next: NextFunction) => next(),
};

async function loadMiddlewaresConfig(projectRoot: string): Promise<MiddlewareEntry[]> {
  const cfgBase = path.join(projectRoot, "config", "middlewares");
  const cfgFile = findModuleFile(cfgBase);
  if (!cfgFile) return [];
  try {
    const exported = await importUserModule(cfgFile);
    const value = typeof exported === "function" ? await (exported as () => unknown)() : exported;
    if (Array.isArray(value)) return value as MiddlewareEntry[];
    return [];
  } catch (err) {
    console.warn(
      `[Enterprise:Middlewares] Could not load ${cfgFile}: ${(err as Error).message}`,
    );
    return [];
  }
}

async function loadGlobalMiddleware(
  projectRoot: string,
  name: string,
  app: unknown,
  config?: Record<string, unknown>,
): Promise<RequestHandler | null> {
  const dir = path.join(projectRoot, "src", "middlewares");
  if (!isDirectory(dir)) return null;
  const file = findModuleInDir(dir, name);
  if (!file) return null;
  try {
    const mod = await importUserModule(file);
    if (typeof mod === "function") {
      const result = await (mod as MiddlewareFactory)(config, app);
      return result;
    }
    return null;
  } catch (err) {
    console.warn(
      `[Enterprise:Middlewares] Failed to load "${name}" from ${file}: ${(err as Error).message}`,
    );
    return null;
  }
}

export interface LoadedMiddlewares {
  /** Express middlewares in declared order (not yet applied). */
  handlers: { name: string; handler: RequestHandler }[];
  /** Names that resolved successfully (for diagnostics). */
  resolved: string[];
  /** Names that did not resolve (skipped). */
  unresolved: string[];
  /** Names of user middlewares discovered in src/middlewares/ even if not in config. */
  discovered: string[];
}

export async function loadMiddlewaresFromPath(
  projectRoot: string,
  app: unknown,
): Promise<LoadedMiddlewares> {
  const out: LoadedMiddlewares = {
    handlers: [],
    resolved: [],
    unresolved: [],
    discovered: [],
  };

  const dir = path.join(projectRoot, "src", "middlewares");
  if (isDirectory(dir)) {
    for (const file of safeReadDir(dir)) {
      const m = file.match(/^(.*?)\.(ts|js|mjs|cjs|tsx)$/);
      if (m) out.discovered.push(m[1]);
    }
  }

  const entries = await loadMiddlewaresConfig(projectRoot);
  for (const raw of entries) {
    const entry: { name: string; config?: Record<string, unknown>; resolve?: string; enabled?: boolean } =
      typeof raw === "string" ? { name: raw } : { ...raw };
    if (entry.enabled === false) continue;
    if (!entry.name) continue;

    if (entry.name.startsWith("enterprise::")) {
      const key = entry.name.slice("enterprise::".length);
      const factory = BUILTINS[key];
      if (factory) {
        const handler = await factory(entry.config, app);
        out.handlers.push({ name: entry.name, handler });
        out.resolved.push(entry.name);
      } else {
        out.unresolved.push(entry.name);
      }
      continue;
    }

    if (entry.name.startsWith("global::")) {
      const key = entry.name.slice("global::".length);
      const handler = await loadGlobalMiddleware(projectRoot, key, app, entry.config);
      if (handler) {
        out.handlers.push({ name: entry.name, handler });
        out.resolved.push(entry.name);
      } else {
        out.unresolved.push(entry.name);
      }
      continue;
    }

    if (entry.resolve) {
      try {
        const mod = (await import(entry.resolve)) as Record<string, unknown>;
        const f = (mod.default ?? mod) as unknown;
        if (typeof f === "function") {
          const handler = await (f as MiddlewareFactory)(entry.config, app);
          out.handlers.push({ name: entry.name, handler });
          out.resolved.push(entry.name);
          continue;
        }
      } catch (err) {
        console.warn(
          `[Enterprise:Middlewares] resolve "${entry.resolve}" failed: ${(err as Error).message}`,
        );
      }
      out.unresolved.push(entry.name);
      continue;
    }

    // Bare name: try src/middlewares/<name> as a fallback.
    const handler = await loadGlobalMiddleware(projectRoot, entry.name, app, entry.config);
    if (handler) {
      out.handlers.push({ name: entry.name, handler });
      out.resolved.push(entry.name);
    } else {
      out.unresolved.push(entry.name);
    }
  }

  return out;
}
