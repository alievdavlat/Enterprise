import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { DatabaseAdapter } from "@enterprise/database";

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
