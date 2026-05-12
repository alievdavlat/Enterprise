export interface Locale {
  id?: number;
  name: string;
  code: string;
  isDefault: boolean;
}

type DbLike = {
  findOneBy: (table: string, where: Record<string, unknown>) => Promise<unknown>;
  findMany: (
    table: string,
    opts?: { filters?: Record<string, unknown>; pagination?: { page: number; pageSize: number } },
  ) => Promise<{ data: unknown[] }>;
};

/**
 * Locale service. Reads from `enterprise_locales` (created in EnterpriseServer.initialize).
 * Caches for 30s to avoid hammering the DB on every request.
 */
export class LocaleService {
  private db: DbLike;
  private table: string;
  private cache: { locales: Locale[]; loadedAt: number } | null = null;
  private cacheTtlMs: number;

  constructor(opts: { db: DbLike; table?: string; cacheTtlMs?: number }) {
    this.db = opts.db;
    this.table = opts.table ?? "enterprise_locales";
    this.cacheTtlMs = opts.cacheTtlMs ?? 30_000;
  }

  async getAll(force = false): Promise<Locale[]> {
    if (!force && this.cache && Date.now() - this.cache.loadedAt < this.cacheTtlMs) {
      return this.cache.locales;
    }
    const result = await this.db.findMany(this.table, {
      pagination: { page: 1, pageSize: 500 },
    });
    const locales = (result.data as Locale[]) ?? [];
    this.cache = { locales, loadedAt: Date.now() };
    return locales;
  }

  async getDefault(): Promise<Locale | null> {
    const all = await this.getAll();
    return all.find((l) => l.isDefault) ?? all[0] ?? null;
  }

  async findByCode(code: string): Promise<Locale | null> {
    const all = await this.getAll();
    return all.find((l) => l.code === code) ?? null;
  }

  async validate(code: string): Promise<boolean> {
    if (!code) return false;
    const all = await this.getAll();
    return all.some((l) => l.code === code);
  }

  /**
   * Resolve a requested locale to a real one. Falls back to default when
   * the request omits a locale or supplies an unknown code.
   */
  async resolve(requested?: string | null): Promise<string | null> {
    if (requested && (await this.validate(requested))) return requested;
    const def = await this.getDefault();
    return def?.code ?? null;
  }

  invalidate(): void {
    this.cache = null;
  }
}
