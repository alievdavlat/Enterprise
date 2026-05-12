import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { DatabaseAdapter } from "@enterprise/database";
import type { PermissionManager } from "@enterprise/core";

const JWT_SECRET =
  process.env.JWT_SECRET || "enterprise-jwt-secret-change-in-production";

/**
 * Authenticate a request via JWT Bearer token.
 * Attaches decoded payload to `req.user`.
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: {
        status: 401,
        name: "Unauthorized",
        message: "No authorization token provided",
      },
    });
    return;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({
      error: {
        status: 401,
        name: "Unauthorized",
        message: "Invalid token format. Use: Bearer <token>",
      },
    });
    return;
  }

  try {
    const decoded = jwt.verify(parts[1], JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (err) {
    if ((err as Error).name === "TokenExpiredError") {
      res.status(401).json({
        error: { status: 401, name: "Unauthorized", message: "Token expired" },
      });
    } else {
      res.status(401).json({
        error: { status: 401, name: "Unauthorized", message: "Invalid token" },
      });
    }
  }
}

/**
 * Admin-only middleware (Strapi-like).
 * Requires a valid JWT **and** an admin or superAdmin role.
 */
export function adminAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  authMiddleware(req, res, () => {
    const user = (req as any).user;
    if (!user || !["admin", "superAdmin"].includes(user.role)) {
      res.status(403).json({
        error: {
          status: 403,
          name: "Forbidden",
          message: "Admin access required",
        },
      });
      return;
    }
    next();
  });
}

/**
 * Content-API auth middleware (Strapi-like).
 *
 * - GET requests are public (like Strapi's default Public role with find/findOne).
 * - Mutating requests (POST/PUT/DELETE) require either:
 *   1. A valid JWT (user or admin), OR
 *   2. A valid API token (from enterprise_api_tokens table).
 *
 * Attaches `req.user` (JWT) or `req.apiToken` (token row) to the request.
 */
export function createContentApiAuth(db: DatabaseAdapter) {
  return async function contentApiAuth(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const isReadOnly = req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS";
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      if (isReadOnly) {
        (req as any).user = null;
        return next();
      }
      res.status(401).json({
        error: {
          status: 401,
          name: "Unauthorized",
          message: "Authentication required for write operations",
        },
      });
      return;
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      res.status(401).json({
        error: {
          status: 401,
          name: "Unauthorized",
          message: "Invalid token format. Use: Bearer <token>",
        },
      });
      return;
    }

    const token = parts[1];

    // Try JWT first
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      (req as any).user = decoded;
      return next();
    } catch {
      // Not a valid JWT — try API token
    }

    // Try API token lookup
    try {
      const apiToken = await db.findOneBy("enterprise_api_tokens", {
        accessKey: token,
      });
      if (apiToken) {
        const tokenType = (apiToken as { type?: string }).type || "read-only";
        if (!isReadOnly && tokenType === "read-only") {
          res.status(403).json({
            error: {
              status: 403,
              name: "Forbidden",
              message: "Read-only API token cannot perform write operations",
            },
          });
          return;
        }
        (req as any).apiToken = apiToken;
        (req as any).user = { role: "api-token", tokenType };
        return next();
      }
    } catch {
      // DB lookup failed
    }

    if (isReadOnly) {
      (req as any).user = null;
      return next();
    }

    res.status(401).json({
      error: {
        status: 401,
        name: "Unauthorized",
        message: "Invalid or expired token",
      },
    });
  };
}

const READ_ACTIONS = new Set(["find", "findOne", "count"]);

/**
 * Map a request's auth state to the role string that PermissionManager rules
 * key off of. Mirrors Strapi's resolution:
 *   - admin / superAdmin keep their explicit role (PermissionManager bypasses them)
 *   - JWT user with any other role keeps that role (defaults to "authenticated")
 *   - API token: `read-only` is treated like `public` for writes and `authenticated` for reads;
 *     `full` and `custom` are treated like `authenticated`. Stricter per-token enforcement
 *     belongs in a later phase once token-scoped rules are stored.
 *   - No auth → "public"
 */
export function resolveRequestRole(req: Request, action: string): string {
  const user = (req as { user?: { role?: string; tokenType?: string } | null }).user;
  if (!user) return "public";
  if (user.role === "api-token") {
    if (user.tokenType === "read-only") {
      return READ_ACTIONS.has(action) ? "authenticated" : "public";
    }
    return "authenticated";
  }
  return user.role || "authenticated";
}

/**
 * Build a middleware that enforces a permission on the current request.
 *
 * `actionFor` may be either a static action string (when the route always
 * checks the same permission) or a callback that derives the action from
 * the request — useful when one handler covers create + update and we need
 * to distinguish on the fly.
 */
export function requirePermission(
  permissionManager: PermissionManager,
  actionFor: string | ((req: Request) => string),
) {
  return function permissionGuard(req: Request, res: Response, next: NextFunction): void {
    const action = typeof actionFor === "function" ? actionFor(req) : actionFor;
    const role = resolveRequestRole(req, action.split(".").pop() || "");
    if (!permissionManager.can(action, role)) {
      res.status(403).json({
        error: {
          status: 403,
          name: "ForbiddenError",
          message: `Forbidden: missing permission "${action}" for role "${role}"`,
        },
      });
      return;
    }
    next();
  };
}
