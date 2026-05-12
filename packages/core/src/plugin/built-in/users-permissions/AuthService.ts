import crypto from "crypto";

export interface AuthUser {
  id: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  confirmed?: boolean;
  confirmationToken?: string | null;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: string | null;
  password?: string;
}

type DbLike = {
  findOneBy: (table: string, where: Record<string, unknown>) => Promise<unknown>;
  findOne: (table: string, id: number | string) => Promise<unknown>;
  create: (table: string, data: Record<string, unknown>) => Promise<unknown>;
  update: (table: string, id: number | string, data: Record<string, unknown>) => Promise<unknown>;
};

export interface AuthConfig {
  jwtSecret?: string;
  jwtExpiresIn?: string;
  /** Force email confirmation before login is allowed */
  requireEmailConfirmation?: boolean;
  /** Default role assigned to new self-registrations */
  defaultRole?: string;
  /** Disable public self-registration */
  allowRegister?: boolean;
  resetPasswordTtlMs?: number;
}

/**
 * Auth service for users-permissions. Wraps password hashing, registration,
 * login, password reset, and email confirmation against `enterprise_users`.
 *
 * Token signing uses `jsonwebtoken` lazily so consumers that don't need JWTs
 * don't pull it in.
 */
export class AuthService {
  private db: DbLike;
  private table: string;
  private cfg: Required<AuthConfig>;

  constructor(opts: { db: DbLike; table?: string; config?: AuthConfig }) {
    this.db = opts.db;
    this.table = opts.table ?? "enterprise_users";
    const c = opts.config ?? {};
    this.cfg = {
      jwtSecret: c.jwtSecret ?? process.env.JWT_SECRET ?? "enterprise-dev-secret-change-me",
      jwtExpiresIn: c.jwtExpiresIn ?? "7d",
      requireEmailConfirmation: c.requireEmailConfirmation ?? false,
      defaultRole: c.defaultRole ?? "authenticated",
      allowRegister: c.allowRegister ?? true,
      resetPasswordTtlMs: c.resetPasswordTtlMs ?? 60 * 60 * 1000,
    };
  }

  getConfig(): Required<AuthConfig> {
    return this.cfg;
  }

  /** Replace the live config (e.g. when admin changes Users & Permissions advanced settings). */
  setConfig(patch: AuthConfig): void {
    this.cfg = { ...this.cfg, ...patch } as Required<AuthConfig>;
  }

  async hashPassword(plain: string): Promise<string> {
    const bcrypt = (await import("bcryptjs")).default;
    return bcrypt.hash(plain, 10);
  }

  async verifyPassword(plain: string, hashed: string): Promise<boolean> {
    if (!hashed) return false;
    const bcrypt = (await import("bcryptjs")).default;
    return bcrypt.compare(plain, hashed);
  }

  async signToken(user: Pick<AuthUser, "id" | "email" | "role">): Promise<string> {
    const jwt = (await import("jsonwebtoken")).default;
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      this.cfg.jwtSecret,
      { expiresIn: this.cfg.jwtExpiresIn } as never,
    );
  }

  async verifyToken<T extends Record<string, unknown> = Record<string, unknown>>(
    token: string,
  ): Promise<T | null> {
    try {
      const jwt = (await import("jsonwebtoken")).default;
      return jwt.verify(token, this.cfg.jwtSecret) as T;
    } catch {
      return null;
    }
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    return (await this.db.findOneBy(this.table, { email })) as AuthUser | null;
  }

  async register(input: {
    email: string;
    password: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  }): Promise<AuthUser> {
    if (!this.cfg.allowRegister) {
      throw new Error("Self-registration is disabled");
    }
    const existing = await this.findByEmail(input.email);
    if (existing) throw new Error("Email already in use");

    const hash = await this.hashPassword(input.password);
    const confirmationToken = this.cfg.requireEmailConfirmation
      ? crypto.randomBytes(24).toString("hex")
      : null;
    const created = (await this.db.create(this.table, {
      email: input.email,
      username: input.username ?? input.email.split("@")[0],
      password: hash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role ?? this.cfg.defaultRole,
      isActive: true,
      confirmed: !this.cfg.requireEmailConfirmation,
      confirmationToken,
    })) as AuthUser;
    return created;
  }

  async login(email: string, password: string): Promise<AuthUser> {
    const user = await this.findByEmail(email);
    if (!user) throw new Error("Invalid credentials");
    if (!user.isActive) throw new Error("Account disabled");
    if (this.cfg.requireEmailConfirmation && user.confirmed === false) {
      throw new Error("Email not confirmed");
    }
    const ok = await this.verifyPassword(password, user.password ?? "");
    if (!ok) throw new Error("Invalid credentials");
    return user;
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    const user = (await this.db.findOne(this.table, userId)) as AuthUser | null;
    if (!user) throw new Error("User not found");
    const ok = await this.verifyPassword(oldPassword, user.password ?? "");
    if (!ok) throw new Error("Current password is incorrect");
    const hash = await this.hashPassword(newPassword);
    await this.db.update(this.table, userId, { password: hash });
  }

  /**
   * Issue a reset token and persist its expiry. Returns the token so the
   * caller (typically the email plugin) can send the link.
   */
  async requestPasswordReset(email: string): Promise<{ token: string; user: AuthUser } | null> {
    const user = await this.findByEmail(email);
    if (!user || user.id == null) return null;
    const token = crypto.randomBytes(24).toString("hex");
    const expires = new Date(Date.now() + this.cfg.resetPasswordTtlMs).toISOString();
    await this.db.update(this.table, user.id, {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    });
    return { token, user };
  }

  async resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
    const user = (await this.db.findOneBy(this.table, {
      resetPasswordToken: token,
    })) as AuthUser | null;
    if (!user || user.id == null) throw new Error("Invalid reset token");
    if (user.resetPasswordExpires && new Date(user.resetPasswordExpires).getTime() < Date.now()) {
      throw new Error("Reset token expired");
    }
    const hash = await this.hashPassword(newPassword);
    await this.db.update(this.table, user.id, {
      password: hash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
  }

  async confirmEmail(token: string): Promise<AuthUser> {
    const user = (await this.db.findOneBy(this.table, {
      confirmationToken: token,
    })) as AuthUser | null;
    if (!user || user.id == null) throw new Error("Invalid confirmation token");
    await this.db.update(this.table, user.id, {
      confirmed: true,
      confirmationToken: null,
    });
    return { ...user, confirmed: true, confirmationToken: null };
  }
}
