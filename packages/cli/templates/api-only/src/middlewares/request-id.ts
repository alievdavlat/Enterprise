/**
 * Example custom middleware.
 *
 * Adds an `X-Request-Id` header to every response. Reference it in
 * `config/middlewares.ts` as `"global::request-id"` to enable.
 */

import type { Request, Response, NextFunction } from "express";

export default function requestIdMiddleware(_config?: Record<string, unknown>) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    res.setHeader("X-Request-Id", id);
    next();
  };
}
