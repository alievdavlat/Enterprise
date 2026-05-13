import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import type { DatabaseAdapter } from "@enterprise/database";
import { getOAuthPreset, listOAuthPresets, type OAuthUserInfo } from "./oauth-providers";

const PROVIDERS_TABLE = "enterprise_auth_providers";
const USERS_TABLE = "enterprise_users";
const JWT_SECRET = process.env.JWT_SECRET || "enterprise-jwt-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

interface ProviderRow {
  id?: number;
  name: string;
  enabled: boolean | number;
  clientId?: string | null;
  clientSecret?: string | null;
  scope?: string | null;
  redirectUri?: string | null;
  /** Comma-separated allowed redirect destinations after callback. */
  allowedRedirects?: string | null;
}

/**
 * Build the redirect URI we'll hand to the IdP. Falls back to a path on the
 * current host if the admin hasn't configured one — useful for dev. The
 * resolved value MUST match what the admin registered in the IdP console.
 */
function resolveRedirectUri(req: Request, provider: string, configured?: string | null): string {
  if (configured) return configured;
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol;
  const host = req.headers.host;
  return `${proto}://${host}/api/auth/oauth/${provider}/callback`;
}

/**
 * GET /api/auth/oauth/:provider/redirect — kick off the OAuth flow.
 * Returns either a 302 to the IdP authorize URL, or a JSON `{ url }` so
 * the front-end can `window.location.assign` itself (handy when the call
 * is fetch-based).
 */
function buildAuthorizeUrl(opts: {
  preset: ReturnType<typeof getOAuthPreset> & {};
  row: ProviderRow;
  redirectUri: string;
  state: string;
}): string {
  const params = new URLSearchParams({
    client_id: opts.row.clientId ?? "",
    redirect_uri: opts.redirectUri,
    response_type: "code",
    scope: opts.row.scope?.trim() || opts.preset.defaultScope,
    state: opts.state,
  });
  return `${opts.preset.authorizeUrl}?${params.toString()}`;
}

/** Read the IdP token response — Discord/GitHub want form-encoded, all accept JSON in. */
async function exchangeCodeForToken(opts: {
  preset: ReturnType<typeof getOAuthPreset> & {};
  row: ProviderRow;
  code: string;
  redirectUri: string;
}): Promise<{ accessToken: string; raw: Record<string, unknown> }> {
  const body = new URLSearchParams({
    client_id: opts.row.clientId ?? "",
    client_secret: opts.row.clientSecret ?? "",
    code: opts.code,
    redirect_uri: opts.redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch(opts.preset.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Token exchange failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as Record<string, unknown>;
  const accessToken =
    (typeof data.access_token === "string" && data.access_token) ||
    (typeof (data as { id_token?: string }).id_token === "string" && (data as { id_token: string }).id_token);
  if (!accessToken) {
    throw new Error(`No access_token in response: ${JSON.stringify(data).slice(0, 200)}`);
  }
  return { accessToken: accessToken as string, raw: data };
}

async function fetchUserInfo(opts: {
  preset: ReturnType<typeof getOAuthPreset> & {};
  accessToken: string;
}): Promise<OAuthUserInfo> {
  const url = opts.preset.userInfoUrl;
  const useBearer = opts.preset.userInfoAuthStrategy !== "queryToken";
  const res = await fetch(url, {
    headers: useBearer
      ? {
          Authorization: `Bearer ${opts.accessToken}`,
          Accept: "application/json",
          "User-Agent": "enterprise-cms",
        }
      : { Accept: "application/json", "User-Agent": "enterprise-cms" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`User info failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const raw = (await res.json()) as Record<string, unknown>;
  return opts.preset.normaliseUser(raw);
}

/**
 * Match the IdP user to a local one (by email) or create a new row. Returns
 * the local user record so the caller can mint a JWT for it.
 */
async function findOrCreateUser(
  db: DatabaseAdapter,
  provider: string,
  info: OAuthUserInfo,
): Promise<Record<string, unknown>> {
  if (info.email) {
    const existing = await db.findOneBy(USERS_TABLE, { email: info.email });
    if (existing) return existing;
  }
  // Fallback unique email when the provider didn't expose one (Twitter free
  // tier, for instance). Synthesised but stable per (provider, providerId).
  const email = info.email ?? `${provider}-${info.id}@oauth.local`;
  const created = await db.create(USERS_TABLE, {
    email,
    username: info.username ?? email.split("@")[0],
    firstName: info.name ?? null,
    lastName: null,
    password: null,
    role: "authenticated",
    isActive: true,
    confirmed: true,
  });
  return created;
}

/**
 * Pages this URL after a successful callback. `redirect` query param is
 * respected when it's relative or matches one of the admin-allowed
 * destinations; otherwise we fall back to a sane default.
 */
function safeRedirectTarget(req: Request, row: ProviderRow): string {
  const requested = (req.query.redirect as string | undefined) ?? null;
  if (!requested) return "/admin";
  // Always allow same-origin relative paths.
  if (requested.startsWith("/") && !requested.startsWith("//")) return requested;
  const allowed = (row.allowedRedirects ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowed.includes(requested)) return requested;
  return "/admin";
}

export function createOAuthRouter(db: DatabaseAdapter): Router {
  const router = Router();

  /**
   * GET /api/auth/oauth — list every enabled provider so the login page can
   * render its social buttons. Public; no secrets exposed.
   */
  router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await db.tableExists(PROVIDERS_TABLE))) return res.json({ data: [] });
      const rows = (
        await db.findMany(PROVIDERS_TABLE, { pagination: { page: 1, pageSize: 100 } })
      ).data as unknown as ProviderRow[];
      const enabled = rows.filter((r) => r.enabled);
      const out = enabled
        .map((r) => {
          const preset = getOAuthPreset(r.name);
          if (!preset) return null;
          return {
            name: preset.name,
            displayName: preset.displayName,
            redirectPath: `/api/auth/oauth/${preset.name}/redirect`,
          };
        })
        .filter(Boolean);
      res.json({ data: out });
    } catch (err) {
      next(err);
    }
  });

  router.get(
    "/:provider/redirect",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const name = String(req.params.provider).toLowerCase();
        const preset = getOAuthPreset(name);
        if (!preset) return res.status(404).json({ error: { status: 404, message: "Unknown provider" } });
        const row = (await db.findOneBy(PROVIDERS_TABLE, { name })) as ProviderRow | null;
        if (!row?.enabled || !row.clientId || !row.clientSecret) {
          return res.status(503).json({
            error: { status: 503, message: `Provider "${name}" is not enabled or not configured` },
          });
        }
        const state = crypto.randomBytes(16).toString("hex");
        const url = buildAuthorizeUrl({
          preset,
          row,
          redirectUri: resolveRedirectUri(req, name, row.redirectUri),
          state,
        });
        // Pass the requested post-login redirect through the state so the
        // callback can resolve it without an extra cookie.
        const redirect = (req.query.redirect as string | undefined) ?? "";
        const encodedState = `${state}.${Buffer.from(redirect).toString("base64url")}`;
        const urlWithState = url.replace(`state=${state}`, `state=${encodedState}`);
        // JSON for fetch-style callers, redirect for direct navigation.
        if (req.headers.accept?.includes("application/json")) {
          return res.json({ data: { url: urlWithState } });
        }
        res.redirect(urlWithState);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/:provider/callback",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const name = String(req.params.provider).toLowerCase();
        const preset = getOAuthPreset(name);
        if (!preset) return res.status(404).json({ error: { status: 404, message: "Unknown provider" } });
        const code = req.query.code as string | undefined;
        const stateParam = (req.query.state as string | undefined) ?? "";
        if (!code) {
          return res.status(400).json({ error: { status: 400, message: "code missing" } });
        }
        const row = (await db.findOneBy(PROVIDERS_TABLE, { name })) as ProviderRow | null;
        if (!row?.enabled || !row.clientId || !row.clientSecret) {
          return res.status(503).json({
            error: { status: 503, message: `Provider "${name}" is not enabled` },
          });
        }
        const redirectUri = resolveRedirectUri(req, name, row.redirectUri);
        const { accessToken } = await exchangeCodeForToken({ preset, row, code, redirectUri });
        const info = await fetchUserInfo({ preset, accessToken });
        const user = await findOrCreateUser(db, name, info);
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN } as never,
        );
        // Record audit row so admins see SSO sign-ins next to local logins.
        try {
          await db.create("enterprise_audit_logs", {
            action: `admin.login.${name}`,
            userId: (user as { id?: number }).id ?? null,
            email: (user as { email?: string }).email ?? null,
            ip: req.ip,
            userAgent: req.headers["user-agent"] ?? null,
            payload: JSON.stringify({ provider: name }),
          });
        } catch {
          /* audit best-effort */
        }
        // Decode the post-login redirect carried through state.
        let redirect = "/admin";
        const [, encodedRedirect] = stateParam.split(".");
        if (encodedRedirect) {
          try {
            const decoded = Buffer.from(encodedRedirect, "base64url").toString("utf8");
            if (decoded) {
              const fakeReq = { ...req, query: { ...req.query, redirect: decoded } } as unknown as Request;
              redirect = safeRedirectTarget(fakeReq, row);
            }
          } catch {
            /* ignore */
          }
        }
        // Pass the token to the admin via the URL fragment so it never hits
        // server logs. The admin's login page reads it on mount.
        const url = `${redirect}${redirect.includes("?") ? "&" : "?"}sso=1#token=${token}`;
        res.redirect(url);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}

export { listOAuthPresets, getOAuthPreset };
