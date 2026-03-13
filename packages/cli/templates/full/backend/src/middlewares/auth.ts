import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "enterprise-jwt-secret-change-in-production";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res
      .status(401)
      .json({
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
    res
      .status(401)
      .json({
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
      res
        .status(401)
        .json({
          error: {
            status: 401,
            name: "Unauthorized",
            message: "Token expired",
          },
        });
    } else {
      res
        .status(401)
        .json({
          error: {
            status: 401,
            name: "Unauthorized",
            message: "Invalid token",
          },
        });
    }
  }
}

export function adminAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  authMiddleware(req, res, () => {
    const user = (req as any).user;
    if (!user || !["admin", "superAdmin"].includes(user.role)) {
      res
        .status(403)
        .json({
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
