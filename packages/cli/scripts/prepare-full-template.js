#!/usr/bin/env node
/**
 * Optional: Prepares templates/full for npm publish.
 * The default create flow uses only templates/default and templates/api-only;
 * this script is not run by prepare:templates. Run manually if you need
 * templates/full (backend + admin workspaces). Copies packages/backends/express +
 * packages/admin into packages/cli/templates/full and sets @enterprise/* to semver (^version).
 */
const fs = require("fs-extra");
const path = require("path");

const CLI_DIR = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(CLI_DIR, "..", "..");
const FULL_TEMPLATE = path.join(CLI_DIR, "templates", "full");

const copyFilter = (src) => {
  const n = src.replace(/\\/g, "/");
  if (!/node_modules|\.next\/|\/dist\/|\.turbo\//.test(n) && !/\.(tsbuildinfo|log)$/.test(n)) {
    // Do not copy compiled .js/.js.map/.d.ts from backend src (use only .ts sources)
    if (/packages\/backends\/express\/src\//.test(n) && /\.(js|js\.map|d\.ts|d\.ts\.map)$/.test(n)) return false;
    return true;
  }
  return false;
};

async function main() {
  const cliPkg = await fs.readJson(path.join(CLI_DIR, "package.json"));
  const version = cliPkg.version || "1.0.0";

  const backendSrc = path.join(REPO_ROOT, "packages", "backends", "express");
  const adminSrc = path.join(REPO_ROOT, "packages", "admin");

  if (!(await fs.pathExists(backendSrc)) || !(await fs.pathExists(adminSrc))) {
    console.warn("prepare-full-template: packages/backends/express or packages/admin not found, skip.");
    return;
  }

  await fs.ensureDir(FULL_TEMPLATE);
  await fs.emptyDir(FULL_TEMPLATE);

  const backendDest = path.join(FULL_TEMPLATE, "backend");
  const adminDest = path.join(FULL_TEMPLATE, "admin");

  await fs.copy(backendSrc, backendDest, { filter: copyFilter });
  await fs.copy(adminSrc, adminDest, { filter: copyFilter });

  const ref = (name) => `^${version}`;

  const backendPkgPath = path.join(backendDest, "package.json");
  const backendPkg = await fs.readJson(backendPkgPath);
  backendPkg.name = "backend";
  if (backendPkg.dependencies) {
    if (backendPkg.dependencies["@enterprise/core"]) backendPkg.dependencies["@enterprise/core"] = ref("core");
    if (backendPkg.dependencies["@enterprise/database"]) backendPkg.dependencies["@enterprise/database"] = ref("database");
    if (backendPkg.dependencies["@enterprise/types"]) backendPkg.dependencies["@enterprise/types"] = ref("types");
  }
  await fs.writeJson(backendPkgPath, backendPkg, { spaces: 2 });

  const adminPkgPath = path.join(adminDest, "package.json");
  const adminPkg = await fs.readJson(adminPkgPath);
  adminPkg.name = "admin";
  if (adminPkg.dependencies) {
    if (adminPkg.dependencies["@enterprise/design-system"]) adminPkg.dependencies["@enterprise/design-system"] = ref("design-system");
    if (adminPkg.dependencies["@enterprise/hooks"]) adminPkg.dependencies["@enterprise/hooks"] = ref("hooks");
    if (adminPkg.dependencies["@enterprise/utils"]) adminPkg.dependencies["@enterprise/utils"] = ref("utils");
    if (adminPkg.dependencies["@enterprise/types"]) adminPkg.dependencies["@enterprise/types"] = ref("types");
  }
  await fs.writeJson(adminPkgPath, adminPkg, { spaces: 2 });

  await fs.writeJson(
    path.join(FULL_TEMPLATE, "package.json"),
    {
      name: "my-enterprise-app",
      version: "1.0.0",
      private: true,
      scripts: {
        dev: "npm run dev --workspaces --if-present",
        build: "npm run build --workspaces --if-present",
        start: "npm run start --workspaces --if-present",
        "dev:admin": "npm run dev -w admin",
        "dev:backend": "npm run dev -w backend",
      },
      workspaces: ["admin", "backend"],
      engines: { node: ">=18.0.0" },
    },
    { spaces: 2 }
  );

  const envExample = path.join(backendDest, ".env.example");
  if (await fs.pathExists(envExample)) {
    await fs.copy(envExample, path.join(backendDest, ".env"));
  }

  console.log("prepare-full-template: templates/full ready for npm (version " + version + ")");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
