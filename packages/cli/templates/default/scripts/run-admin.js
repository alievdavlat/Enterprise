/**
 * Run admin UI from node_modules/@enterprise/admin (Strapi-style).
 */
const path = require("path");
const { spawn } = require("child_process");
const rootDir = process.cwd();
require("dotenv").config({ path: path.join(rootDir, ".env") });
const adminDir = path.join(rootDir, "node_modules", "@enterprise", "admin");
const port = process.env.ADMIN_PORT || "3000";
const child = spawn("npx", ["next", "dev", "--turbopack", "-p", port], {
  cwd: adminDir,
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:9390/api" },
});
child.on("exit", (code) => process.exit(code ?? 0));
