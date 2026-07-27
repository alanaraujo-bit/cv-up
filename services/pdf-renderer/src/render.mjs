import { PDFDocument } from "pdf-lib";

import { config } from "./config.mjs";

/**
 * A4 with zero margins. The margins live in the page's own CSS `@page` rule,
 * which is what makes the printed sheet identical to the on-screen preview —
 * overriding them here would silently undo that.
 */
const PDF_OPTIONS = {
  format: "A4",
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
};

/**
 * Opens a signed render URL and prints it.
 *
 * `page.pdf()` already emulates print media, so the `@media print` rules in the
 * app's stylesheet apply: the preview's stacked sheets collapse into one flow
 * and Chromium paginates it against the same `[data-block]` boundaries the
 * preview measured (ADR 0007).
 */
/**
 * A failure the app knows how to phrase. The renderer deliberately does not
 * carry user-facing copy — it has no idea who is reading it.
 */
export class RenderError extends Error {
  constructor(code, detail) {
    super(detail);
    this.code = code;
  }
}

export async function renderPdf(browser, renderUrl) {
  const context = await browser.newContext({
    // The résumé must never be printed in dark mode, and a stray reduced-motion
    // or high-contrast preference must not reach it either.
    colorScheme: "light",
    reducedMotion: "reduce",
    // A desktop viewport: the page is laid out in millimetres, but a phone
    // viewport would still trigger the app's mobile breakpoints.
    viewport: { width: 1280, height: 1600 },
  });

  const page = await context.newPage();

  try {
    let response;
    try {
      response = await page.goto(renderUrl, {
        waitUntil: "networkidle",
        timeout: config.renderTimeoutMs,
      });
    } catch (error) {
      throw new RenderError("timeout", `goto failed: ${error.message}`);
    }

    if (!response) {
      throw new RenderError("unreachable", "no response from the render page");
    }
    if (!response.ok()) {
      // 404 is what an expired or already-finished token looks like.
      throw new RenderError(
        "unreachable",
        `render page returned ${response.status()}`,
      );
    }

    // The render page marks its own root. Without this a redirect to the
    // sign-in screen would be printed as if it were the résumé.
    try {
      await page.waitForSelector("[data-render-root]", {
        timeout: config.renderTimeoutMs,
      });
    } catch {
      throw new RenderError("unreachable", "render root never appeared");
    }

    // Web fonts change every metric on the page, and a PDF printed mid-swap has
    // the wrong line breaks — which is precisely what this whole design exists
    // to avoid.
    await page.evaluate(() => document.fonts.ready);

    const pdf = await page.pdf(PDF_OPTIONS);

    return { pdf, pageCount: await countPages(pdf) };
  } finally {
    await context.close();
  }
}

/** Page count read back from the PDF, or null if it cannot be determined. */
async function countPages(pdf) {
  try {
    const document = await PDFDocument.load(pdf, { updateMetadata: false });
    return document.getPageCount();
  } catch {
    return null;
  }
}
