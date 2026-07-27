/**
 * Configuration, validated once at boot.
 *
 * The renderer holds no database credentials and no blob token: it talks only
 * to the app, over HTTP, with one shared secret (ADR 0008). Two variables is
 * the whole surface, which is the point.
 */

function required(name) {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function number(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number, got ${raw}`);
  }
  return parsed;
}

export const config = {
  /** Base URL of the CV UP app, e.g. https://cvup.vercel.app */
  appUrl: required("APP_URL").replace(/\/$/, ""),
  /** Must equal RENDER_WORKER_SECRET in the app. */
  secret: required("RENDER_WORKER_SECRET"),

  /** How often to ask for work when the queue was empty. */
  idlePollMs: number("IDLE_POLL_MS", 5000),
  /** How long to wait after an error before asking again. */
  errorBackoffMs: number("ERROR_BACKOFF_MS", 15000),
  /** A single render that takes longer than this is abandoned. */
  renderTimeoutMs: number("RENDER_TIMEOUT_MS", 45000),
  /** Health check port. Railway needs something listening. */
  port: number("PORT", 8080),
};
