/**
 * Custom service for the `article` content type.
 *
 * Auto-discovered from `src/api/article/services/article.ts` and registered
 * under the UID `api::article.article`. Other code can call:
 *
 *   const articles = app.service('api::article.article');
 *   const featured = await articles.findFeatured();
 */

export default ({ app: _app }: { app: unknown }) => ({
  async findFeatured() {
    return [];
  },
});
