#!/usr/bin/env node
/**
 * Post-install bootstrap for fresh clones.
 *
 * Several packages (admin, backends/express, cli) consume their workspace
 * siblings (`@enterprise/core`, `@enterprise/database`, `@enterprise/types`,
 * `@enterprise/design-system`, etc.) via the compiled `dist/` output. When
 * someone clones the repo and runs `npm install`, none of those `dist/`
 * folders exist yet, so the first `npm run dev` or `npm run build -w admin`
 * fails with "Cannot find module @enterprise/<pkg>" or stale type errors.
 *
 * This script auto-builds the library packages once after install, but only
 * when the dist folders are actually missing — repeat installs in an already
 * built repo skip the work.
 *
 * Skip in CI (`CI=true`) when the caller is doing their own build pipeline.
 * Skip when `ENTERPRISE_SKIP_POSTINSTALL=1` for advanced users.
 * Skip when this script is being run inside a generated user app (no
 * `turbo.json` in the parent — generated apps consume published packages).
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

if (process.env.ENTERPRISE_SKIP_POSTINSTALL === "1") {
  process.exit(0);
}

const repoRoot = path.resolve(__dirname, "..");

// Only bootstrap when the monorepo workspaces are actually present.
const turboConfig = path.join(repoRoot, "turbo.json");
if (!fs.existsSync(turboConfig)) {
  process.exit(0);
}

const libs = [
  "packages/types",
  "packages/core",
  "packages/database",
  "packages/utils",
  "packages/hooks",
  "packages/design-system",
];

const missing = libs.filter((p) => !fs.existsSync(path.join(repoRoot, p, "dist")));
if (missing.length === 0) {
  // All libs already built — nothing to do.
  process.exit(0);
}

console.log(
  "[postinstall] First-run bootstrap — building shared library packages so admin / backend / cli can resolve them.",
);
console.log("[postinstall] missing dist/:", missing.join(", "));

// Use `build:libs` so the script stays in lockstep with the script the user
// can invoke manually. Falling back to `turbo run build` (full graph) would
// also build admin/backend, which takes much longer and isn't necessary for
// `npm run dev`.
const result = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build:libs"], {
  cwd: repoRoot,
  stdio: "inherit",
  env: { ...process.env, FORCE_COLOR: "1" },
});

if (result.status !== 0) {
  console.warn(
    "[postinstall] build:libs failed. Run `npm run build:libs` manually before `npm run dev`.",
  );
  // Don't fail npm install — let the user retry.
  process.exit(0);
}
