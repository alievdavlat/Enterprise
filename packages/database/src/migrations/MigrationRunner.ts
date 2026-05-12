import fs from "fs";
import path from "path";
import type { DatabaseAdapter } from "../adapter";

export interface Migration {
  /** Filename without extension; sort key (timestamp-prefixed) */
  name: string;
  /** Absolute path to the migration file */
  filePath: string;
  /** Loaded module — lazy so discovery doesn't require a working migration */
  up: (db: DatabaseAdapter) => Promise<void> | void;
  down?: (db: DatabaseAdapter) => Promise<void> | void;
}

export interface MigrationStatus {
  name: string;
  executed: boolean;
  executedAt?: string;
}

/**
 * Filesystem-driven migration runner. Discovers `*.ts` / `*.js` files under
 * `database/migrations/`, sorts them by filename (so the convention is
 * `<YYYYMMDDHHmmss>__<name>.ts`), tracks executed names in
 * `enterprise_migrations`, and applies pending migrations in order.
 *
 * `down()` rolls back the most-recent N executed migrations by calling their
 * `down` export — migrations that don't define one are skipped (can't roll
 * back a destructive change without an explicit reversal).
 *
 * The runner deliberately does NOT auto-discover migrations on import — call
 * `discover()` so consumers control timing and can pass a custom directory.
 */
export class MigrationRunner {
  private db: DatabaseAdapter;
  private migrationsDir: string;
  private trackingTable: string;
  private discovered: Migration[] | null = null;

  constructor(opts: {
    db: DatabaseAdapter;
    migrationsDir: string;
    trackingTable?: string;
  }) {
    this.db = opts.db;
    this.migrationsDir = path.resolve(opts.migrationsDir);
    this.trackingTable = opts.trackingTable ?? "enterprise_migrations";
  }

  /** Ensure the tracking table exists. Safe to call repeatedly. */
  async ensureTrackingTable(): Promise<void> {
    if (await this.db.tableExists(this.trackingTable)) return;
    await this.db.createTable(this.trackingTable, {
      columns: [
        { name: "name", type: "string", nullable: false, unique: true },
        { name: "executedAt", type: "datetime", nullable: false },
      ],
      timestamps: false,
    });
  }

  /**
   * Read migration files from disk. Returns the in-memory list (sorted),
   * caching for the runner instance. Pass `{ force: true }` to re-scan.
   */
  async discover(opts?: { force?: boolean }): Promise<Migration[]> {
    if (!opts?.force && this.discovered) return this.discovered;
    if (!fs.existsSync(this.migrationsDir)) {
      this.discovered = [];
      return this.discovered;
    }
    const files = (await fs.promises.readdir(this.migrationsDir))
      .filter((f) => /\.(ts|js|cjs|mjs)$/i.test(f) && !/\.d\.ts$/i.test(f))
      .sort();

    const out: Migration[] = [];
    for (const file of files) {
      const filePath = path.join(this.migrationsDir, file);
      const name = file.replace(/\.(ts|js|cjs|mjs)$/i, "");
      try {
        // Use require so CommonJS + .ts via ts-node-dev both work; users can
        // also drop compiled .js next to the .ts file.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require(filePath);
        const up = mod.up ?? mod.default?.up;
        const down = mod.down ?? mod.default?.down;
        if (typeof up !== "function") {
          console.warn(`[migrations] ${file} has no up() export — skipped`);
          continue;
        }
        out.push({ name, filePath, up, down: typeof down === "function" ? down : undefined });
      } catch (err) {
        console.warn(`[migrations] failed to load ${file}:`, err);
      }
    }
    this.discovered = out;
    return out;
  }

  /** Return the set of executed migration names. */
  async getExecuted(): Promise<Map<string, string>> {
    await this.ensureTrackingTable();
    const rows = (
      await this.db.findMany(this.trackingTable, {
        pagination: { page: 1, pageSize: 5000 },
      })
    ).data as { name: string; executedAt: string }[];
    return new Map(rows.map((r) => [r.name, r.executedAt]));
  }

  /** List every discovered migration + whether it has been applied. */
  async status(): Promise<MigrationStatus[]> {
    const [files, executed] = await Promise.all([this.discover(), this.getExecuted()]);
    return files.map((f) => ({
      name: f.name,
      executed: executed.has(f.name),
      executedAt: executed.get(f.name),
    }));
  }

  /**
   * Apply every pending migration in order. Returns the names that ran.
   * Stops on the first failure and re-throws so the caller can decide.
   */
  async up(): Promise<string[]> {
    const [files, executed] = await Promise.all([this.discover(), this.getExecuted()]);
    const applied: string[] = [];
    for (const migration of files) {
      if (executed.has(migration.name)) continue;
      console.log(`[migrations] applying ${migration.name}`);
      await migration.up(this.db);
      await this.db.create(this.trackingTable, {
        name: migration.name,
        executedAt: new Date().toISOString(),
      });
      applied.push(migration.name);
    }
    return applied;
  }

  /**
   * Roll back the last N migrations (default 1). Each rolled-back migration
   * has its `enterprise_migrations` row removed; migrations without a `down`
   * export throw so the user knows the rollback is incomplete.
   */
  async down(steps = 1): Promise<string[]> {
    const [files, executed] = await Promise.all([this.discover(), this.getExecuted()]);
    const fileMap = new Map(files.map((f) => [f.name, f]));
    // Order executed by executedAt desc — most recent first.
    const executedSorted = [...executed.entries()]
      .sort((a, b) => (a[1] < b[1] ? 1 : -1))
      .slice(0, steps);
    const rolledBack: string[] = [];
    for (const [name] of executedSorted) {
      const migration = fileMap.get(name);
      if (!migration) {
        throw new Error(
          `Cannot roll back ${name}: file not found in ${this.migrationsDir}`,
        );
      }
      if (!migration.down) {
        throw new Error(`Cannot roll back ${name}: no down() export`);
      }
      console.log(`[migrations] rolling back ${name}`);
      await migration.down(this.db);
      const row = (await this.db.findOneBy(this.trackingTable, { name })) as
        | { id: number }
        | null;
      if (row) await this.db.delete(this.trackingTable, row.id);
      rolledBack.push(name);
    }
    return rolledBack;
  }
}

/**
 * Build a timestamp prefix for a new migration filename. Format:
 * `<YYYYMMDDHHmmss>__<safe-name>` so `ls` sorts chronologically.
 */
export function buildMigrationFilename(name: string): string {
  const safe = name.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const ts =
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `${ts}__${safe}.ts`;
}

/** Default boilerplate for a new migration file. */
export function migrationTemplate(): string {
  return `import type { DatabaseAdapter } from "@enterprise/database";

export async function up(db: DatabaseAdapter): Promise<void> {
  // await db.raw("ALTER TABLE example ADD COLUMN status VARCHAR(50)");
}

export async function down(db: DatabaseAdapter): Promise<void> {
  // await db.raw("ALTER TABLE example DROP COLUMN status");
}
`;
}
