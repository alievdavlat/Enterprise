/**
 * Lifecycle hooks for the `article` content type.
 *
 * Auto-discovered from
 *   src/api/article/content-types/article/lifecycles.ts
 * and wired into the LifecycleManager scoped to `api::article.article`.
 *
 * Each hook receives a context object with the request data and may mutate
 * it (before-* hooks) or wrap the result (after-* hooks).
 */

export default {
  async beforeCreate(ctx: { params?: { data?: Record<string, unknown> } }) {
    if (!ctx.params?.data) return;
    const data = ctx.params.data;
    if (typeof data.title === "string" && !data.slug) {
      data.slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
  },

  async afterCreate(ctx: { result?: Record<string, unknown> }) {
    console.log("[lifecycles:article] afterCreate", ctx.result?.id ?? "(no id)");
  },
};
