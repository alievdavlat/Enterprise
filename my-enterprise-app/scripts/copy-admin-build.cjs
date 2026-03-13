const fs = require("fs");
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
}