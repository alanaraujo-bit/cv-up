import "server-only";

import { createHmac, hkdfSync, timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env";

/**
 * Bearer tokens for `/render/[token]`.
 *
 * That route renders somebody's private résumé with no session cookie, because
 * the caller is a headless browser (ADR 0002). The token is therefore the only
 * thing standing between a client's personal data and anyone who guesses a URL,
 * and it is deliberately narrow: it names one export of one résumé, it expires
 * in minutes, and the route additionally refuses to serve it once that export
 * has finished — so a leaked token is worthless almost immediately.
 *
 * The signing key is derived from `BETTER_AUTH_SECRET` with HKDF rather than
 * being its own variable. Domain separation means a render token can never be
 * confused with a session token, and there is one secret to rotate instead of
 * two to keep in sync.
 */

const KEY_INFO = "cv-up/render-token/v1";
const TOKEN_VERSION = "1";

/** Long enough for a cold worker to boot and render, short enough to be dull. */
export const RENDER_TOKEN_TTL_SECONDS = 300;

let cachedKey: Buffer | null = null;

function signingKey(): Buffer {
  cachedKey ??= Buffer.from(
    hkdfSync("sha256", env.BETTER_AUTH_SECRET, "", KEY_INFO, 32),
  );
  return cachedKey;
}

export interface RenderTokenPayload {
  exportId: string;
  resumeId: string;
  userId: string;
  /** Seconds since the epoch. */
  expiresAt: number;
}

const base64url = (value: Buffer | string) =>
  Buffer.from(value).toString("base64url");

function sign(body: string): string {
  return createHmac("sha256", signingKey()).update(body).digest("base64url");
}

export function createRenderToken(
  payload: Omit<RenderTokenPayload, "expiresAt">,
  ttlSeconds = RENDER_TOKEN_TTL_SECONDS,
): string {
  const full: RenderTokenPayload = {
    ...payload,
    expiresAt: Math.floor(Date.now() / 1000) + ttlSeconds,
  };

  const body = `${TOKEN_VERSION}.${base64url(JSON.stringify(full))}`;
  return `${body}.${sign(body)}`;
}

/**
 * The payload, or null for anything that is not a currently valid token.
 * Every failure returns the same null: a caller must not be able to tell a
 * forged signature from an expired one.
 */
export function verifyRenderToken(token: string): RenderTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [version, encoded, signature] = parts;
  if (version !== TOKEN_VERSION || !encoded || !signature) return null;

  const expected = sign(`${version}.${encoded}`);
  const given = Buffer.from(signature);
  const want = Buffer.from(expected);

  // Compare lengths first: timingSafeEqual throws on a mismatch.
  if (given.length !== want.length || !timingSafeEqual(given, want))
    return null;

  let payload: RenderTokenPayload;
  try {
    payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as RenderTokenPayload;
  } catch {
    return null;
  }

  if (
    typeof payload?.exportId !== "string" ||
    typeof payload?.resumeId !== "string" ||
    typeof payload?.userId !== "string" ||
    typeof payload?.expiresAt !== "number"
  ) {
    return null;
  }

  if (payload.expiresAt <= Math.floor(Date.now() / 1000)) return null;

  return payload;
}
