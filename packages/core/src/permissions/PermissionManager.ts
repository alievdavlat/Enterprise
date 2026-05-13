/**
 * Permission manager (Strapi-style, with extras: field-level scoping,
 * conditions, custom actions registry).
 *
 * Action identifiers follow Strapi's "<subject>.<verb>" convention but the
 * manager doesn't enforce it — callers can register any string. The default
 * action set covers the Strapi verbs (find / findOne / count / create /
 * update / delete / publish / unpublish) plus bulk variants the bulk-ops
 * router added in Phase 5.
 */
export type Action = string;
export type Role = string;

export type ConditionFn = (ctx: {
  user?: { id?: number | string; role?: string; [key: string]: unknown } | null;
  entry?: Record<string, unknown> | null;
  [key: string]: unknown;
}) => boolean | Promise<boolean>;

export interface PermissionRule {
  /** Strapi-style "<subject>.<verb>" or any arbitrary action key. */
  action: Action;
  /** Role this rule applies to. */
  role: Role;
  /** Allow / deny. Explicit deny wins over allow. */
  allow: boolean;
  /**
   * Fields the rule scopes to. Empty / undefined = all fields. When set, the
   * `canField()` check returns true only for fields in this list (or false
   * when the rule denies).
   */
  fields?: string[];
  /**
   * Names of conditions registered via `registerCondition()`. The rule only
   * applies when every named condition returns true for the request.
   */
  conditions?: string[];
}

/** Strapi's standard verbs plus the bulk + draft & publish variants we ship. */
export const DEFAULT_ACTIONS = [
  "find",
  "findOne",
  "count",
  "create",
  "update",
  "delete",
  "publish",
  "unpublish",
  "bulkCreate",
  "bulkUpdate",
  "bulkDelete",
] as const;

export class PermissionManager {
  private rules: PermissionRule[] = [];
  private defaultAllowAdmin = true;
  private conditions = new Map<string, ConditionFn>();
  private customActions = new Set<string>();

  // ---- Rule registration ----

  addRule(rule: PermissionRule): void {
    this.rules.push(rule);
  }

  addRules(rules: PermissionRule[]): void {
    this.rules.push(...rules);
  }

  clear(action?: Action): void {
    if (action) this.rules = this.rules.filter((r) => r.action !== action);
    else this.rules = [];
  }

  getRules(): PermissionRule[] {
    return [...this.rules];
  }

  setDefaultAllowAdmin(allow: boolean): void {
    this.defaultAllowAdmin = allow;
  }

  // ---- Conditions ----

  /**
   * Register a named condition function. Rules reference these by name via
   * `conditions: ["mine"]`. Used to express "user can only update entries
   * they created" without baking it into every check call.
   */
  registerCondition(name: string, fn: ConditionFn): void {
    this.conditions.set(name, fn);
  }

  getCondition(name: string): ConditionFn | undefined {
    return this.conditions.get(name);
  }

  listConditions(): string[] {
    return Array.from(this.conditions.keys());
  }

  // ---- Custom action registry ----

  /**
   * Plugins call this to declare actions they own (e.g. an "upload" plugin
   * registers `plugin::upload.assets.create`). The Roles UI uses
   * `listKnownActions()` to render checkboxes including these custom keys.
   */
  registerAction(action: string): void {
    this.customActions.add(action);
  }

  /**
   * Every action the system knows about: the default Strapi verbs plus any
   * custom actions plugins have registered plus actions referenced by an
   * existing rule. Useful for building the admin Roles matrix.
   */
  listKnownActions(): string[] {
    const out = new Set<string>([...DEFAULT_ACTIONS, ...this.customActions]);
    for (const r of this.rules) out.add(r.action);
    return Array.from(out).sort();
  }

  // ---- Authorization checks ----

  /**
   * Plain check — no condition or field evaluation, just "is there a matching
   * allow rule for this (action, role)". Use this in the request-pipeline
   * permission middleware where the user object isn't available yet.
   */
  can(action: Action, role: Role): boolean {
    if (this.defaultAllowAdmin && (role === "admin" || role === "superAdmin")) {
      return true;
    }
    const matching = this.rules.filter((r) => r.action === action && r.role === role);
    if (matching.length === 0) return false;
    if (matching.some((r) => !r.allow)) return false;
    return matching.some((r) => r.allow);
  }

  /**
   * Conditional check — evaluates every registered condition the matching
   * rule references. Used when the request context (user, target entry)
   * is available. Returns:
   *   - true  — allowed (admin bypass, or allow rule with all conditions true)
   *   - false — denied (no matching allow rule, or a condition rejected)
   */
  async canWithContext(
    action: Action,
    role: Role,
    context: Parameters<ConditionFn>[0] = {},
  ): Promise<boolean> {
    if (this.defaultAllowAdmin && (role === "admin" || role === "superAdmin")) {
      return true;
    }
    const matching = this.rules.filter((r) => r.action === action && r.role === role);
    if (matching.length === 0) return false;
    if (matching.some((r) => !r.allow)) return false;

    for (const rule of matching) {
      if (!rule.allow) continue;
      const conditionNames = rule.conditions ?? [];
      let allPass = true;
      for (const name of conditionNames) {
        const fn = this.conditions.get(name);
        if (!fn) {
          // Unknown condition — fail closed.
          allPass = false;
          break;
        }
        try {
          const ok = await fn(context);
          if (!ok) {
            allPass = false;
            break;
          }
        } catch {
          allPass = false;
          break;
        }
      }
      if (allPass) return true;
    }
    return false;
  }

  /**
   * Field-level check. Allowed when at least one matching allow rule:
   *   - has no `fields` list (allows everything), OR
   *   - explicitly includes the requested field.
   * Use this for per-field write authorization in update handlers, e.g.
   * "Editor can update title but not slug".
   */
  canField(action: Action, role: Role, field: string): boolean {
    if (this.defaultAllowAdmin && (role === "admin" || role === "superAdmin")) {
      return true;
    }
    const matching = this.rules.filter((r) => r.action === action && r.role === role);
    if (matching.length === 0) return false;
    const allowRules = matching.filter((r) => r.allow);
    if (allowRules.length === 0) return false;
    return allowRules.some((r) => !r.fields || r.fields.length === 0 || r.fields.includes(field));
  }

  /**
   * Filter a data object down to the fields the role is allowed to write.
   * Returns a shallow copy with disallowed keys removed.
   */
  filterAllowedFields<T extends Record<string, unknown>>(
    action: Action,
    role: Role,
    data: T,
  ): Partial<T> {
    if (this.defaultAllowAdmin && (role === "admin" || role === "superAdmin")) {
      return { ...data };
    }
    const out: Partial<T> = {};
    for (const [key, value] of Object.entries(data) as [keyof T, unknown][]) {
      if (this.canField(action, role, String(key))) {
        out[key] = value as T[keyof T];
      }
    }
    return out;
  }
}
