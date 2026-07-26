import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

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

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  reloadOnOnline: true,
});

/**
 * Serwist builds the service worker through a webpack plugin, so production
 * builds run `next build --webpack` (see package.json).
 *
 * The wrapper is skipped entirely in dev rather than merely disabled: it
 * injects a `webpack` key either way, and Turbopack — the dev default since
 * Next 16 — refuses to start when it finds one. Dev therefore keeps Turbopack
 * and runs without a service worker, which is what we want anyway, since it
 * would serve stale assets across reloads.
 *
 * Revisit when Serwist ships stable Turbopack support:
 * https://github.com/serwist/serwist/issues/54
 */
export default function config(phase: string): NextConfig {
  return phase === PHASE_DEVELOPMENT_SERVER
    ? nextConfig
    : withSerwist(nextConfig);
}
