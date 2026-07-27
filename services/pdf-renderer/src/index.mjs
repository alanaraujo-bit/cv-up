import { createServer } from "node:http";
import { chromium } from "playwright";

import { config } from "./config.mjs";
import { renderPdf, RenderError } from "./render.mjs";

/**
 * CV UP PDF renderer.
 *
 * Pulls work from the app rather than receiving it (ADR 0008): it needs no
 * inbound URL, no database, and no storage credentials, and a job it dies
 * halfway through is reclaimed by the app instead of being lost.
 */

const authorization = { Authorization: `Bearer ${config.secret}` };

let browser = null;
let stopping = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function log(level, message, extra = {}) {
  // One JSON object per line — Railway's log viewer can filter on the fields.
  console[level === "error" ? "error" : "log"](
    JSON.stringify({ at: new Date().toISOString(), level, message, ...extra }),
  );
}

/** Asks for one job. Returns null when the queue is empty. */
async function claim() {
  const response = await fetch(`${config.appUrl}/api/render/claim`, {
    method: "POST",
    headers: authorization,
  });

  if (response.status === 204) return null;
  if (!response.ok) {
    throw new Error(`claim failed with ${response.status}`);
  }

  return response.json();
}

async function report(exportId, { pdf, pageCount, errorCode }) {
  const headers = { ...authorization, "x-export-id": exportId };

  if (errorCode) {
    // A code, never a sentence: HTTP headers are no place for accented text,
    // and the wording a user sees belongs to the app.
    const response = await fetch(`${config.appUrl}/api/render/complete`, {
      method: "POST",
      headers: { ...headers, "x-export-error": errorCode },
    });
    if (!response.ok) throw new Error(`report failed with ${response.status}`);
    return;
  }

  const response = await fetch(`${config.appUrl}/api/render/complete`, {
    method: "POST",
    headers: {
      ...headers,
      "content-type": "application/pdf",
      ...(pageCount ? { "x-page-count": String(pageCount) } : {}),
    },
    body: pdf,
  });

  if (!response.ok) throw new Error(`upload failed with ${response.status}`);
}

/**
 * One turn of the loop. Returns how long to wait before the next one, so a
 * busy queue is drained without pausing and an empty one is not hammered.
 */
async function tick() {
  const job = await claim();
  if (!job) return config.idlePollMs;

  log("info", "rendering", { exportId: job.exportId, attempt: job.attempt });

  try {
    const { pdf, pageCount } = await renderPdf(browser, job.renderUrl);
    await report(job.exportId, { pdf, pageCount });
    log("info", "rendered", {
      exportId: job.exportId,
      pageCount,
      bytes: pdf.length,
    });
  } catch (error) {
    const code = error instanceof RenderError ? error.code : "render_failed";
    const message = error instanceof Error ? error.message : String(error);
    log("error", "render failed", { exportId: job.exportId, code, message });

    // Reported rather than swallowed: the app decides whether this is a retry
    // or a final failure, and the user is told either way.
    await report(job.exportId, { errorCode: code }).catch((reportError) => {
      log("error", "could not report failure", {
        exportId: job.exportId,
        message: String(reportError),
      });
    });
  }

  // Straight back for the next job; the queue is likely not empty.
  return 0;
}

async function loop() {
  while (!stopping) {
    let wait = config.idlePollMs;

    try {
      wait = await tick();
    } catch (error) {
      // The app being unreachable is normal during its deploy. Back off, and
      // do not treat it as fatal.
      log("error", "poll failed", { message: String(error) });
      wait = config.errorBackoffMs;
    }

    if (wait > 0) await sleep(wait);
  }
}

/** Railway wants something answering on $PORT before it calls the deploy live. */
function startHealthServer() {
  const server = createServer((request, response) => {
    const healthy = browser !== null && browser.isConnected() && !stopping;
    response.writeHead(healthy ? 200 : 503, {
      "content-type": "application/json",
    });
    response.end(JSON.stringify({ status: healthy ? "ok" : "starting" }));
  });

  server.listen(config.port, () => {
    log("info", "health server listening", { port: config.port });
  });

  return server;
}

async function main() {
  const server = startHealthServer();

  // One browser for the process. Launching Chromium per job would dominate the
  // render time; a fresh *context* per job is what keeps jobs isolated.
  browser = await chromium.launch({
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  log("info", "browser ready", { appUrl: config.appUrl });

  const shutdown = async (signal) => {
    if (stopping) return;
    stopping = true;
    log("info", "shutting down", { signal });

    server.close();
    await browser?.close().catch(() => {});
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  await loop();
}

main().catch((error) => {
  log("error", "fatal", { message: String(error) });
  process.exit(1);
});
