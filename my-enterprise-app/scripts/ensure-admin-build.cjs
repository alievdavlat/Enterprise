const fs = require("fs");
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
