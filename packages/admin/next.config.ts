import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

import { existsSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname);
const repoRoot = path.resolve(appDir, "..", "..");
const nextAtRoot = existsSync(path.join(repoRoot, "node_modules", "next", "package.json"));
const nextAtApp = existsSync(path.join(appDir, "node_modules", "next", "package.json"));
const root = nextAtRoot ? repoRoot : nextAtApp ? appDir : path.resolve(process.cwd());

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9390";
const apiUrl = rawApiUrl.replace(/\/api\/?$/, "").replace(/\/+$/, "") || rawApiUrl;

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  turbopack: { root },
  outputFileTracingRoot: root,
  images: { unoptimized: true },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${apiUrl}/api/:path*` },
      { source: "/uploads/:path*", destination: `${apiUrl}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
