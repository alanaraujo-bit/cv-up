import type { Route } from "next";

export const DEFAULT_SIGNED_IN_ROUTE = "/painel" as Route;

/**
 * Turns an untrusted `?proximo=` value into a safe internal destination.
 * Anything absolute, protocol-relative or otherwise off-site is discarded —
 * an open redirect on a sign-in page is a phishing primitive.
 */
export function safeRedirect(value: string | string[] | undefined): Route {
  if (typeof value !== "string") return DEFAULT_SIGNED_IN_ROUTE;
  if (!value.startsWith("/")) return DEFAULT_SIGNED_IN_ROUTE;
  if (value.startsWith("//")) return DEFAULT_SIGNED_IN_ROUTE;
  if (value.includes("\\")) return DEFAULT_SIGNED_IN_ROUTE;
  return value as Route;
}
