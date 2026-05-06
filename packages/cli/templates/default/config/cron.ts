/**
 * Scheduled tasks.
 *
 * Each entry has a cron expression (`* * * * *` style) and a `task` handler
 * that receives `{ app }`. Tasks are loaded at boot and executed by node-cron.
 * Set `enabled: false` to keep an entry but skip scheduling.
 *
 * Example expressions:
 *   - "*​/5 * * * *"  every 5 minutes
 *   - "0 * * * *"  hourly on the 0-minute
 *   - "0 3 * * *"  every day at 03:00
 */

export default {
  // Default sample job. Disabled until you opt in.
  example: {
    schedule: "*/5 * * * *",
    enabled: false,
    task: async ({ app: _app }: { app: unknown }) => {
      console.log("[cron:example] tick", new Date().toISOString());
    },
  },
};
