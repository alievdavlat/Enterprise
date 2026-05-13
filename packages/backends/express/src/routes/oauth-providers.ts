/**
 * OAuth 2.0 provider presets. Each preset is just the IdP-specific URLs +
 * scopes — the actual flow code stays generic so adding "Slack" or "GitLab"
 * later is a one-line addition here.
 *
 * The user-info JSON shapes differ per provider, so each preset also carries
 * a normaliser that maps the response onto a common `{ id, email, name,
 * avatar }` shape.
 */

export interface OAuthUserInfo {
  /** Stable provider-scoped user id. */
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  username?: string;
  /** Raw user info object as returned by the IdP — kept for debugging. */
  raw?: Record<string, unknown>;
}

export interface OAuthProviderPreset {
  /** Lower-case key used in URLs (`/api/auth/oauth/github/...`). */
  name: string;
  /** Human-readable name for the admin UI / login buttons. */
  displayName: string;
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  /** Default scope when the admin hasn't set one. */
  defaultScope: string;
  /**
   * Map the IdP's user info response to our canonical shape. Each preset
   * picks the right fields by name.
   */
  normaliseUser: (raw: Record<string, unknown>) => OAuthUserInfo;
  /** Some IdPs (Google) want the access token as a Bearer header rather than a query param. */
  userInfoAuthStrategy?: "bearer" | "queryToken";
}

const presets: OAuthProviderPreset[] = [
  {
    name: "github",
    displayName: "GitHub",
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    userInfoUrl: "https://api.github.com/user",
    defaultScope: "read:user user:email",
    normaliseUser: (raw) => ({
      id: String(raw.id ?? ""),
      email: typeof raw.email === "string" ? raw.email : undefined,
      name: typeof raw.name === "string" ? raw.name : undefined,
      username: typeof raw.login === "string" ? raw.login : undefined,
      avatar: typeof raw.avatar_url === "string" ? raw.avatar_url : undefined,
      raw,
    }),
  },
  {
    name: "discord",
    displayName: "Discord",
    authorizeUrl: "https://discord.com/api/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    userInfoUrl: "https://discord.com/api/users/@me",
    defaultScope: "identify email",
    normaliseUser: (raw) => {
      const id = String(raw.id ?? "");
      const avatarHash = typeof raw.avatar === "string" ? raw.avatar : "";
      return {
        id,
        email: typeof raw.email === "string" ? raw.email : undefined,
        name: typeof raw.global_name === "string" ? raw.global_name : undefined,
        username: typeof raw.username === "string" ? raw.username : undefined,
        avatar: id && avatarHash ? `https://cdn.discordapp.com/avatars/${id}/${avatarHash}.png` : undefined,
        raw,
      };
    },
  },
  {
    name: "google",
    displayName: "Google",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    defaultScope: "openid email profile",
    userInfoAuthStrategy: "bearer",
    normaliseUser: (raw) => ({
      id: String(raw.sub ?? ""),
      email: typeof raw.email === "string" ? raw.email : undefined,
      name: typeof raw.name === "string" ? raw.name : undefined,
      username: typeof raw.email === "string" ? raw.email.split("@")[0] : undefined,
      avatar: typeof raw.picture === "string" ? raw.picture : undefined,
      raw,
    }),
  },
  {
    name: "facebook",
    displayName: "Facebook",
    authorizeUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    userInfoUrl: "https://graph.facebook.com/me?fields=id,name,email,picture",
    defaultScope: "email public_profile",
    normaliseUser: (raw) => {
      const pic = raw.picture as { data?: { url?: string } } | undefined;
      return {
        id: String(raw.id ?? ""),
        email: typeof raw.email === "string" ? raw.email : undefined,
        name: typeof raw.name === "string" ? raw.name : undefined,
        avatar: pic?.data?.url,
        raw,
      };
    },
  },
  {
    name: "microsoft",
    displayName: "Microsoft",
    authorizeUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    userInfoUrl: "https://graph.microsoft.com/v1.0/me",
    defaultScope: "openid email profile User.Read",
    userInfoAuthStrategy: "bearer",
    normaliseUser: (raw) => ({
      id: String(raw.id ?? ""),
      email: typeof raw.mail === "string"
        ? raw.mail
        : (typeof raw.userPrincipalName === "string" ? raw.userPrincipalName : undefined),
      name: typeof raw.displayName === "string" ? raw.displayName : undefined,
      raw,
    }),
  },
  {
    name: "gitlab",
    displayName: "GitLab",
    authorizeUrl: "https://gitlab.com/oauth/authorize",
    tokenUrl: "https://gitlab.com/oauth/token",
    userInfoUrl: "https://gitlab.com/api/v4/user",
    defaultScope: "read_user",
    normaliseUser: (raw) => ({
      id: String(raw.id ?? ""),
      email: typeof raw.email === "string" ? raw.email : undefined,
      name: typeof raw.name === "string" ? raw.name : undefined,
      username: typeof raw.username === "string" ? raw.username : undefined,
      avatar: typeof raw.avatar_url === "string" ? raw.avatar_url : undefined,
      raw,
    }),
  },
  {
    name: "twitter",
    displayName: "X (Twitter)",
    authorizeUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    userInfoUrl: "https://api.twitter.com/2/users/me?user.fields=profile_image_url",
    defaultScope: "users.read tweet.read",
    userInfoAuthStrategy: "bearer",
    normaliseUser: (raw) => {
      const data = raw.data as Record<string, unknown> | undefined;
      const inner = data ?? raw;
      return {
        id: String(inner.id ?? ""),
        username: typeof inner.username === "string" ? inner.username : undefined,
        name: typeof inner.name === "string" ? inner.name : undefined,
        avatar: typeof inner.profile_image_url === "string" ? inner.profile_image_url : undefined,
        raw,
      };
    },
  },
];

const presetByName = new Map(presets.map((p) => [p.name, p]));

export function getOAuthPreset(name: string): OAuthProviderPreset | undefined {
  return presetByName.get(name.toLowerCase());
}

export function listOAuthPresets(): OAuthProviderPreset[] {
  return [...presets];
}

/**
 * Build a preset from a DB row when isCustom = true. The customConfig JSON
 * carries authorizeUrl / tokenUrl / userInfoUrl / displayName / defaultScope
 * + an optional `userMapping` object that tells us which raw fields map to
 * id / email / name / avatar (no code eval — pure data shape).
 */
export function buildCustomPreset(
  name: string,
  customConfig: string | Record<string, unknown> | null,
): OAuthProviderPreset | undefined {
  if (!customConfig) return undefined;
  let cfg: Record<string, unknown>;
  if (typeof customConfig === "string") {
    try { cfg = JSON.parse(customConfig); }
    catch { return undefined; }
  } else {
    cfg = customConfig;
  }
  const required = ["authorizeUrl", "tokenUrl", "userInfoUrl"] as const;
  for (const k of required) {
    if (typeof cfg[k] !== "string") return undefined;
  }
  const mapping = (cfg.userMapping as Record<string, string> | undefined) ?? {};
  const idKey = mapping.id ?? "id";
  const emailKey = mapping.email ?? "email";
  const nameKey = mapping.name ?? "name";
  const avatarKey = mapping.avatar ?? "avatar_url";
  const usernameKey = mapping.username ?? "username";
  return {
    name: name.toLowerCase(),
    displayName: (cfg.displayName as string) || name,
    authorizeUrl: cfg.authorizeUrl as string,
    tokenUrl: cfg.tokenUrl as string,
    userInfoUrl: cfg.userInfoUrl as string,
    defaultScope: (cfg.defaultScope as string) || "openid email profile",
    userInfoAuthStrategy: cfg.userInfoAuthStrategy === "queryToken" ? "queryToken" : "bearer",
    normaliseUser: (raw) => ({
      id: String(raw[idKey] ?? ""),
      email: typeof raw[emailKey] === "string" ? (raw[emailKey] as string) : undefined,
      name: typeof raw[nameKey] === "string" ? (raw[nameKey] as string) : undefined,
      username: typeof raw[usernameKey] === "string" ? (raw[usernameKey] as string) : undefined,
      avatar: typeof raw[avatarKey] === "string" ? (raw[avatarKey] as string) : undefined,
      raw,
    }),
  };
}
