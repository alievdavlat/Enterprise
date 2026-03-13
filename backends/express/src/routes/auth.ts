import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { DatabaseAdapter } from "@enterprise/database";

const JWT_SECRET =
  process.env.JWT_SECRET || "enterprise-jwt-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export function createAuthRouter(db: DatabaseAdapter): Router {
  const router = Router();

  /**
   * POST /api/auth/local
   * Login with email/password
   */
  router.post(
    "/local",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { identifier, password } = req.body;
        if (!identifier || !password) {
          return res
            .status(400)
            .json({
              error: {
                status: 400,
                message: "identifier and password are required",
              },
            });
        }

        const user = await db.findOneBy("enterprise_users", {
          email: identifier,
        });
        if (!user || !user.password) {
          await db.create("enterprise_audit_logs", {
            action: "admin.login.fail",
            userId: null,
            email: identifier,
            ip: (req as any).ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
            userAgent: req.headers["user-agent"] || null,
            payload: JSON.stringify({ reason: "user_not_found" }),
          }).catch(() => {});
          return res
            .status(401)
            .json({ error: { status: 401, message: "Invalid credentials" } });
        }

        const isValid = await bcrypt.compare(password, user.password as string);
        if (!isValid) {
          await db.create("enterprise_audit_logs", {
            action: "admin.login.fail",
            userId: user.id,
            email: user.email,
            ip: (req as any).ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
            userAgent: req.headers["user-agent"] || null,
            payload: JSON.stringify({ reason: "invalid_password" }),
          }).catch(() => {});
          return res
            .status(401)
            .json({ error: { status: 401, message: "Invalid credentials" } });
        }

        if (!user.isActive) {
          return res
            .status(401)
            .json({ error: { status: 401, message: "Account is not active" } });
        }

        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions,
        );

        await db.create("enterprise_audit_logs", {
          action: "admin.login.success",
          userId: user.id,
          email: user.email,
          ip: (req as any).ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
          userAgent: req.headers["user-agent"] || null,
          payload: JSON.stringify({ identifier: identifier }),
        }).catch(() => {});

        const { password: _, ...safeUser } = user;
        res.json({ jwt: token, user: safeUser });
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * POST /api/auth/local/register
   * Register a new user
   */
  router.post(
    "/local/register",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email, username, password, firstName, lastName } = req.body;
        if (!email || !username || !password) {
          return res
            .status(400)
            .json({
              error: {
                status: 400,
                message: "email, username, and password are required",
              },
            });
        }

        const existing = await db.findOneBy("enterprise_users", { email });
        if (existing) {
          return res
            .status(400)
            .json({ error: { status: 400, message: "Email already in use" } });
        }

        // First user becomes superAdmin (Strapi-like bootstrap)
        const allUsers = await db.findMany("enterprise_users", {
          pagination: { page: 1, pageSize: 1 },
        });
        const isFirstUser = allUsers.data.length === 0;

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await db.create("enterprise_users", {
          email,
          username,
          password: hashedPassword,
          firstName: firstName || "",
          lastName: lastName || "",
          role: isFirstUser ? "superAdmin" : "authenticated",
          isActive: true,
        });

        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions,
        );

        const { password: _, ...safeUser } = user;
        res.status(201).json({ jwt: token, user: safeUser });
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * GET /api/auth/me
   * Get current user profile
   */
  router.get("/me", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ error: { status: 401, message: "No token provided" } });
      }

      const token = authHeader.split(" ")[1];
      const payload = jwt.verify(token, JWT_SECRET) as { id: string };
      const user = await db.findOne("enterprise_users", payload.id);
      if (!user) {
        return res
          .status(404)
          .json({ error: { status: 404, message: "User not found" } });
      }
      const { password: _, ...safeUser } = user;
      res.json({ data: safeUser });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/auth/forgot-password
   */
  router.post(
    "/forgot-password",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email } = req.body;
        if (!email) {
          return res
            .status(400)
            .json({ error: { status: 400, message: "email is required" } });
        }
        // In production, send email with reset link
        res.json({
          ok: true,
          message: "An email has been sent to reset your password",
        });
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * POST /api/auth/change-password
   */
  router.post(
    "/change-password",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { currentPassword, password, passwordConfirmation } = req.body;
        if (!currentPassword || !password || !passwordConfirmation) {
          return res
            .status(400)
            .json({
              error: { status: 400, message: "All fields are required" },
            });
        }
        if (password !== passwordConfirmation) {
          return res
            .status(400)
            .json({
              error: { status: 400, message: "Passwords do not match" },
            });
        }

        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
          return res
            .status(401)
            .json({ error: { status: 401, message: "Not authenticated" } });
        }

        const token = authHeader.split(" ")[1];
        const payload = jwt.verify(token, JWT_SECRET) as { id: string };
        const user = await db.findOne("enterprise_users", payload.id);
        if (!user) {
          return res
            .status(404)
            .json({ error: { status: 404, message: "User not found" } });
        }

        const isValid = await bcrypt.compare(
          currentPassword,
          user.password as string,
        );
        if (!isValid) {
          return res
            .status(401)
            .json({
              error: { status: 401, message: "Current password is incorrect" },
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.update("enterprise_users", payload.id, {
          password: hashedPassword,
        });

        res.json({ ok: true, message: "Password changed successfully" });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
