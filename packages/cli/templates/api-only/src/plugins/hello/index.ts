/**
 * Example custom plugin.
 *
 * Each plugin exports a default object with a unique `name`. The optional
 * `register` and `bootstrap` lifecycle methods receive the running server
 * instance and run before / after the HTTP listener is up. Use `register`
 * for synchronous wiring (services, hooks) and `bootstrap` for async work
 * that needs the database or other plugins.
 *
 * Plugins are auto-discovered from `src/plugins/<name>/index.ts`. Toggle them
 * on/off in `config/plugins.ts`:
 *
 *   export default { hello: { enabled: true } };
 */

export default {
  name: "hello",
  version: "0.1.0",
  description: "Example plugin shipped with the project template.",

  register(_app: unknown) {
    console.log("[Plugin:hello] register()");
  },

  bootstrap(_app: unknown) {
    console.log("[Plugin:hello] bootstrap() – ready to serve");
  },

  destroy() {
    console.log("[Plugin:hello] destroy() – cleaning up");
  },
};
