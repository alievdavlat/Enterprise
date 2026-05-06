/**
 * Middlewares config.
 *
 * Each entry is either:
 *  - "enterprise::<builtin>"  – a built-in middleware (logger, cors, security,
 *    body, query, errors, poweredBy, compression)
 *  - "global::<name>"         – a custom middleware in src/middlewares/<name>.ts
 *  - { name, config }         – the same with options
 *
 * Order matters – middlewares run top-to-bottom on every request before the
 * API routers.
 */

export default [
  "enterprise::logger",
  "enterprise::poweredBy",
  "enterprise::cors",
  "enterprise::security",
  "enterprise::query",
  "enterprise::body",
  "global::request-id",
  "enterprise::errors",
];
