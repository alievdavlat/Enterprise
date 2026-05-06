/**
 * Enterprise Cron Manager.
 *
 * Strapi-style scheduled jobs. Users declare jobs in `config/cron.ts` or via
 * `app.cron.add(...)` from a plugin. Jobs only run when the manager is started.
 *
 * The `node-cron` dependency is loaded lazily inside `start()` so that core
 * builds and runs without it; if it is missing at runtime we log a clear
 * message and skip scheduling instead of crashing.
 */

export interface CronJob {
  /** Unique name, e.g. "cleanup-tokens" */
  name: string;
  /** Cron expression, e.g. "0 * * * *" (every hour) */
  schedule: string;
  /** Handler invoked at each tick. May return a promise. */
  handler: () => void | Promise<void>;
  /** When false, the job is registered but not scheduled. Default: true. */
  enabled?: boolean;
  /** IANA timezone (passed through to node-cron). */
  timezone?: string;
}

interface ScheduledTask {
  job: CronJob;
  task?: { start: () => void; stop: () => void };
}

export class CronManager {
  private jobs: Map<string, ScheduledTask> = new Map();
  private started = false;

  /** Register a job. If the manager is already started, schedule it now. */
  add(job: CronJob): void {
    if (this.jobs.has(job.name)) {
      console.warn(`[Enterprise:Cron] Job "${job.name}" already registered – overwriting.`);
      this.remove(job.name);
    }
    this.jobs.set(job.name, { job });
    if (this.started && job.enabled !== false) {
      void this.scheduleOne(job.name);
    }
  }

  /** Stop and unregister a job. */
  remove(name: string): void {
    const entry = this.jobs.get(name);
    if (entry?.task) entry.task.stop();
    this.jobs.delete(name);
  }

  /** All registered jobs (independent of running state). */
  list(): CronJob[] {
    return Array.from(this.jobs.values()).map((e) => e.job);
  }

  /** Whether a job is currently scheduled with node-cron. */
  isRunning(name: string): boolean {
    return !!this.jobs.get(name)?.task;
  }

  /** Schedule all enabled jobs. Idempotent. */
  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    for (const [name, entry] of this.jobs) {
      if (entry.job.enabled === false) continue;
      await this.scheduleOne(name);
    }
  }

  /** Stop all scheduled jobs. They remain registered. */
  stop(): void {
    for (const entry of this.jobs.values()) {
      if (entry.task) {
        entry.task.stop();
        entry.task = undefined;
      }
    }
    this.started = false;
  }

  private async scheduleOne(name: string): Promise<void> {
    const entry = this.jobs.get(name);
    if (!entry || entry.task) return;
    let cron: typeof import("node-cron") | null = null;
    try {
      cron = (await import("node-cron")) as typeof import("node-cron");
    } catch {
      console.warn(
        '[Enterprise:Cron] "node-cron" is not installed. Skipping schedule for "' +
          name +
          '". Run: npm install node-cron',
      );
      return;
    }
    const { schedule, handler, timezone } = entry.job;
    if (!cron.validate || !cron.validate(schedule)) {
      console.warn(
        `[Enterprise:Cron] Invalid schedule for "${name}": "${schedule}" – skipped.`,
      );
      return;
    }
    const task = cron.schedule(
      schedule,
      async () => {
        try {
          await handler();
        } catch (err) {
          console.error(`[Enterprise:Cron] Job "${name}" failed:`, err);
        }
      },
      timezone ? { timezone } : undefined,
    );
    entry.task = task as unknown as { start: () => void; stop: () => void };
  }
}
