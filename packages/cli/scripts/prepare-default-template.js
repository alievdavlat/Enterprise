#!/usr/bin/env node
/**
 * Builds templates/default from api-only + full-app scripts (Strapi-style: admin from @enterprise/admin).
 * Default template = api-only base + run-admin.js, build-admin.cjs, copy-admin-build.cjs, package.json (develop/build scripts).
 */
const fs = require("fs-extra");
const path = require("path");

const CLI_DIR = path.resolve(__dirname, "..");
const DEFAULT_TEMPLATE = path.join(CLI_DIR, "templates", "default");
const API_ONLY = path.join(CLI_DIR, "templates", "api-only");

const copyFilter = (src) => {
  const n = src.replace(/\\/g, "/");
  return !/node_modules|\.next\/|\/dist\/|\.turbo\//.test(n) && !/\.(tsbuildinfo|log)$/.test(n);
};

async function main() {
  if (!(await fs.pathExists(API_ONLY))) {
    console.warn("prepare-default-template: api-only not found, skip.");
    return;
  }

  await fs.ensureDir(DEFAULT_TEMPLATE);
  await fs.emptyDir(DEFAULT_TEMPLATE);

  await fs.copy(API_ONLY, DEFAULT_TEMPLATE, { filter: copyFilter });

  // Default template uses port 9390 (one server for API + admin)
  const serverPath = path.join(DEFAULT_TEMPLATE, "src", "server.ts");
  if (await fs.pathExists(serverPath)) {
    let serverContent = await fs.readFile(serverPath, "utf8");
    serverContent = serverContent
      .replace(/http:\/\/localhost:3001/g, "http://localhost:9390")
      .replace(/PORT \|\| "3001"/g, 'PORT || "9390"');
    await fs.writeFile(serverPath, serverContent, "utf8");
  }

  const rootPkg = {
    name: "my-enterprise-app",
    version: "1.0.0",
    private: true,
    scripts: {
      develop: "concurrently --names admin,api \"npm run dev:admin\" \"npm run dev:backend\"",
      build: "tsc && node scripts/build-admin.cjs && node scripts/copy-admin-build.cjs",
      start: "node dist/server.js",
      "dev:admin": "node scripts/run-admin.js",
      "dev:backend": "ts-node-dev --respawn --transpile-only src/server.ts",
    },
    dependencies: {},
    devDependencies: { concurrently: "^9.1.0" },
    engines: { node: ">=18.0.0" },
  };
  await fs.writeJson(path.join(DEFAULT_TEMPLATE, "package.json"), rootPkg, { spaces: 2 });

  const scriptsDir = path.join(DEFAULT_TEMPLATE, "scripts");
  await fs.ensureDir(scriptsDir);
  await fs.writeFile(
    path.join(scriptsDir, "run-admin.js"),
    `/**
 * Run admin UI from node_modules/@enterprise/admin (Strapi-style).
 */
const path = require("path");
const { spawn } = require("child_process");
const rootDir = process.cwd();
require("dotenv").config({ path: path.join(rootDir, ".env") });
const adminDir = path.join(rootDir, "node_modules", "@enterprise", "admin");
const port = process.env.ADMIN_PORT || "3000";
const child = spawn("npx", ["next", "dev", "-p", port], {
  cwd: adminDir,
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:9390/api" },
});
child.on("exit", (code) => process.exit(code ?? 0));
`,
    "utf8"
  );
  await fs.writeFile(
    path.join(scriptsDir, "build-admin.cjs"),
    `const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const appRoot = process.cwd();
const adminDir = path.join(appRoot, "node_modules", "@enterprise", "admin");
if (!fs.existsSync(adminDir)) {
  console.error("[Enterprise] @enterprise/admin not found at", adminDir);
  process.exit(1);
}
const adminDirReal = fs.realpathSync(adminDir);
execSync("npm run build", {
  cwd: adminDirReal,
  stdio: "inherit",
  env: { ...process.env, NEXT_PUBLIC_BASE_PATH: "/admin", NEXT_PUBLIC_API_URL: "/api" },
});

function isOutDir(dir) {
  return fs.existsSync(dir) && fs.existsSync(path.join(dir, "index.html"));
}

const searchedDirs = [];
function checkDir(dir) {
  const resolved = path.resolve(dir);
  if (!searchedDirs.includes(resolved)) searchedDirs.push(resolved);
  return isOutDir(resolved) ? resolved : null;
}

const candidates = [
  path.join(appRoot, "out"),
  path.join(adminDirReal, "out"),
  // Next.js 16 (Turbopack) may emit static HTML under .next/build instead of out/
  path.join(adminDirReal, ".next", "build"),
  path.join(adminDirReal, ".next", "export"),
  path.join(adminDirReal, "..", "out"),
  path.join(appRoot, "node_modules", "@enterprise", "admin", "out"),
  path.join(appRoot, "..", "packages", "admin", "out"),
  path.join(appRoot, "..", "out"),
  path.join(appRoot, "..", "..", "out"),
  path.join(appRoot, "..", "..", "..", "out"),
];
if (process.env.USERPROFILE) candidates.push(path.join(process.env.USERPROFILE, "out"));
if (process.env.HOME) candidates.push(path.join(process.env.HOME, "out"));

const rootsToSearch = [appRoot, adminDirReal];
const targetNames = ["out", "build", "export"];
for (const root of rootsToSearch) {
  if (fs.existsSync(root)) {
    try {
      const items = fs.readdirSync(root, { withFileTypes: true });
      for (const item of items) {
        if (item.isDirectory() && (targetNames.includes(item.name) || item.name === ".next")) {
          candidates.push(path.join(root, item.name));
          if (item.name === ".next") {
            candidates.push(path.join(root, ".next", "build"));
            candidates.push(path.join(root, ".next", "export"));
          }
        }
      }
    } catch (e) {}
  }
}

let outDir = null;
for (let i = 0; i < candidates.length; i++) {
  outDir = checkDir(candidates[i]);
  if (outDir) break;
}

if (outDir) {
  fs.writeFileSync(path.join(appRoot, ".enterprise-admin-build-dir"), path.dirname(outDir), "utf8");
  fs.writeFileSync(path.join(appRoot, ".enterprise-admin-out-dir"), outDir, "utf8");
} else {
  fs.writeFileSync(path.join(appRoot, ".enterprise-admin-build-dir"), adminDirReal, "utf8");
}`,
    "utf8"
  );
  await fs.writeFile(
    path.join(scriptsDir, "ensure-admin-build.cjs"),
    `const fs = require("fs");
const path = require("path");
const buildDir = path.join(process.cwd(), "build");
if (!fs.existsSync(buildDir) || !fs.existsSync(path.join(buildDir, "index.html"))) {
  console.log("[Enterprise] Building admin for /admin (first time or missing build/)...");
  require("./build-admin.cjs");
  require("./copy-admin-build.cjs");
  if (!fs.existsSync(path.join(buildDir, "index.html"))) {
    console.error("[Enterprise] Admin build or copy failed. Check errors above.");
    process.exit(1);
  }
} else {
  console.log("[Enterprise] Admin build found at build/");
}
`,
    "utf8"
  );
  await fs.writeFile(
    path.join(scriptsDir, "copy-admin-build.cjs"),
    `const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const buildDir = path.join(appRoot, "build");

function isOutDir(dir) {
  return fs.existsSync(dir) && fs.existsSync(path.join(dir, "index.html"));
}

const searchedDirs = [];
function checkDir(dir) {
  const resolved = path.resolve(dir);
  if (!searchedDirs.includes(resolved)) searchedDirs.push(resolved);
  return isOutDir(resolved) ? resolved : null;
}

let outDir = null;
var outMarker = path.join(appRoot, ".enterprise-admin-out-dir");
if (fs.existsSync(outMarker)) {
  var p = fs.readFileSync(outMarker, "utf8").trim();
  outDir = checkDir(p);
}
if (!outDir) {
  var buildDirMarker = path.join(appRoot, ".enterprise-admin-build-dir");
  if (fs.existsSync(buildDirMarker)) {
    var adminRoot = fs.readFileSync(buildDirMarker, "utf8").trim();
    var subCandidates = [
      path.join(adminRoot, "out"),
      path.join(adminRoot, ".next", "build"),
      path.join(adminRoot, ".next", "export"),
    ];
    for (var s = 0; s < subCandidates.length; s++) {
      outDir = checkDir(subCandidates[s]);
      if (outDir) break;
    }
  }
}
if (!outDir) {
  const adminFromNodeModules = path.join(appRoot, "node_modules", "@enterprise", "admin");
  const candidates = [
    path.join(appRoot, "out"),
    path.join(adminFromNodeModules, "out"),
    path.join(adminFromNodeModules, ".next", "build"),
    path.join(adminFromNodeModules, ".next", "export"),
    path.join(appRoot, "..", "packages", "admin", "out"),
    path.join(appRoot, "..", "packages", "admin", ".next", "build"),
    path.join(appRoot, "..", "packages", "admin", ".next", "export"),
    path.join(appRoot, "..", "out"),
    path.join(appRoot, "..", "..", "out"),
    path.join(appRoot, "..", "..", "..", "out"),
  ];
  if (process.env.USERPROFILE) candidates.push(path.join(process.env.USERPROFILE, "out"));
  if (process.env.HOME) candidates.push(path.join(process.env.HOME, "out"));

  const rootsToSearch = [appRoot, adminFromNodeModules, path.join(appRoot, "..", "packages", "admin")];
  const targetNames = ["out", "build", "export"];
  for (const root of rootsToSearch) {
    if (fs.existsSync(root)) {
      try {
        const items = fs.readdirSync(root, { withFileTypes: true });
        for (const item of items) {
          if (item.isDirectory() && (targetNames.includes(item.name) || item.name === ".next")) {
            candidates.push(path.join(root, item.name));
            if (item.name === ".next") {
              candidates.push(path.join(root, ".next", "build"));
              candidates.push(path.join(root, ".next", "export"));
            }
          }
        }
      } catch (e) {}
    }
  }

  for (var i = 0; i < candidates.length; i++) {
    outDir = checkDir(candidates[i]);
    if (outDir) break;
  }
}
if (outDir) {
  if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
  fs.cpSync(outDir, buildDir, { recursive: true });
  console.log("[Enterprise] Admin build copied to build/");
} else {
  console.error("[Enterprise] Admin 'out' folder not found.");
  console.error("Searched paths:");
  searchedDirs.forEach(d => console.error("  - " + d));
  console.error("Hint: Set turbopack.root in packages/admin/next.config to the admin package directory, or ensure the Next.js process exports static files successfully.");
  process.exit(1);
}`,
    "utf8"
  );

  const adminReadme = path.join(DEFAULT_TEMPLATE, "src", "admin", "README.md");
  await fs.ensureDir(path.dirname(adminReadme));
  await fs.writeFile(
    adminReadme,
    "# Admin customizations (Strapi-style)\n\nThis folder is for **customizing** the admin UI from `@enterprise/admin`.\n",
    "utf8"
  );

  const envExample = path.join(DEFAULT_TEMPLATE, ".env.example");
  if (await fs.pathExists(envExample)) {
    let content = await fs.readFile(envExample, "utf8");
    content = content.replace(/PORT=3001/g, "PORT=9390").replace(/localhost:3001/g, "localhost:9390");
    if (content.includes("NEXT_PUBLIC_API_URL")) {
      content = content.replace(/NEXT_PUBLIC_API_URL=.*/g, "");
    }
    await fs.writeFile(envExample, content);
  }

  console.log("prepare-default-template: templates/default ready (admin from @enterprise/admin)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
