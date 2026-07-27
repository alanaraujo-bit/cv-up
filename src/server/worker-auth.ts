import "server-only";

import { timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env";

/**
 * Authenticates the PDF renderer.
 *
 * The renderer is a second deployable with no user session; it presents a
 * shared secret instead. When no secret is configured the endpoints behave as
 * if they do not exist, which is also what keeps the export button hidden — an
 * unconfigured deployment has no PDF export rather than a broken one.
 */
export function isPdfExportConfigured(): boolean {
  return typeof env.RENDER_WORKER_SECRET === "string";
}

export function isWorkerRequest(request: Request): boolean {
  const secret = env.RENDER_WORKER_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice(7) : "";

  const a = Buffer.from(presented);
  const b = Buffer.from(secret);

  // Length is compared first because timingSafeEqual throws on a mismatch.
  return a.length === b.length && timingSafeEqual(a, b);
}
