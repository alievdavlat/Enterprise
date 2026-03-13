const fs = require("fs");
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
}