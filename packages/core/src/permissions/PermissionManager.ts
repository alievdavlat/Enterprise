/**
 * Permission manager (Strapi-style). Backend auth can use this.
 */
export type Action = string;
export type Role = string;

export interface PermissionRule {
  action: Action;
  role: Role;
  allow: boolean;
}

export class PermissionManager {
  private rules: PermissionRule[] = [];
  private defaultAllowAdmin = true;

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

  can(action: Action, role: Role): boolean {
    if (this.defaultAllowAdmin && (role === "admin" || role === "superAdmin")) {
      return true;
    }
    const matching = this.rules.filter((r) => r.action === action && r.role === role);
    if (matching.length === 0) return false;
    // An explicit deny anywhere wins over an allow — admins use clear() to
    // override defaults, callers can layer additional denies on top.
    if (matching.some((r) => !r.allow)) return false;
    return matching.some((r) => r.allow);
  }

  getRules(): PermissionRule[] {
    return [...this.rules];
  }

  setDefaultAllowAdmin(allow: boolean): void {
    this.defaultAllowAdmin = allow;
  }
}
