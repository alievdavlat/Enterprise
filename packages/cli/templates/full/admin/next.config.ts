import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const adminDir = path.dirname(__filename);
// Monorepo root (full template ichida admin alohida paket sifatida joylashgan)
const monorepoRoot = path.resolve(adminDir, "..", "..");

const nextConfig: NextConfig = {
  output: "export",
  distDir: "out",
  turbopack: {
    root: monorepoRoot,
  },
};

export default nextConfig;
