import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

/** Baseline hardening. Tightened with a CSP once auth lands in phase 1. */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

/**
 * Serwist builds the service worker through a webpack plugin, so production
 * builds run `next build --webpack` (see package.json). Dev keeps Turbopack —
 * the worker is disabled there anyway, since it would serve stale assets
 * across reloads. Revisit when Serwist ships stable Turbopack support:
 * https://github.com/serwist/serwist/issues/54
 */
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
  reloadOnOnline: true,
});

export default withSerwist(nextConfig);
