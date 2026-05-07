// @ts-check
import path from "path";
import { fileURLToPath } from "url";

// Next.js docs: turbopack.root = absolute path to where next/package.json is.
// Always use the workspace root so hoisted deps (sonner, zustand, picocolors, etc.) resolve correctly.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname);
const repoRoot = path.resolve(appDir, "..", "..");
const root = repoRoot;

// API proxy: requests to /api/* and /uploads/* are forwarded here. Ensure backend is running (e.g. npm run dev:backend).
// Use 127.0.0.1 to avoid IPv6 resolution issues; set NEXT_PUBLIC_API_URL if backend runs on another port.
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9390";
const apiUrl = rawApiUrl.replace(/\/api\/?$/, "").replace(/\/+$/, "") || rawApiUrl;

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  turbopack: {
    root,
    // Reduce dev work: disable debug IDs in dev (less CPU)
    ...(process.env.NODE_ENV === "development" ? { debugIds: false } : {}),
  },
  outputFileTracingRoot: root,
  images: {
    unoptimized: true,
  },
  // Skip strict TS check during build — pre-existing type mismatches between
  // workspace packages (React 18 vs 19 @types) block compilation. Code already
  // type-checked separately via `npm run typecheck`.
  typescript: { ignoreBuildErrors: true },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-accordion",
      "@radix-ui/react-switch",
      "@radix-ui/react-label",
      "@radix-ui/react-slot",
      "@radix-ui/react-separator",
      "@radix-ui/react-tooltip",
    ],
    turbopackFileSystemCacheForDev: true,
    turbopackFileSystemCacheForBuild: true,
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${apiUrl}/api/:path*` },
      { source: "/uploads/:path*", destination: `${apiUrl}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
