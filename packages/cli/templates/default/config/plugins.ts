/**
 * Plugins config.
 *
 * Plugins are auto-discovered from `src/plugins/<name>/index.ts`. Use this
 * file to disable a plugin, override its config, or register a third-party
 * plugin via `resolve: 'package-name'`.
 *
 *   export default {
 *     hello: { enabled: true, config: { greet: 'world' } },
 *     'my-thirdparty-plugin': { enabled: true, resolve: 'my-thirdparty-plugin' },
 *   };
 */

export default () => ({
  hello: { enabled: true },
});
