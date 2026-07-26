import { describe, expect, it } from "vitest";

import { DEFAULT_SIGNED_IN_ROUTE, safeRedirect } from "./redirect";

describe("safeRedirect", () => {
  it("keeps internal paths", () => {
    expect(safeRedirect("/configuracoes")).toBe("/configuracoes");
    expect(safeRedirect("/curriculos/abc/editor")).toBe(
      "/curriculos/abc/editor",
    );
  });

  it("falls back when the value is missing or not a single string", () => {
    expect(safeRedirect(undefined)).toBe(DEFAULT_SIGNED_IN_ROUTE);
    expect(safeRedirect(["/painel", "/outro"])).toBe(DEFAULT_SIGNED_IN_ROUTE);
  });

  it("rejects off-site destinations", () => {
    // An open redirect on a sign-in page is a phishing primitive.
    for (const hostile of [
      "https://evil.com",
      "http://evil.com",
      "//evil.com",
      "\\\\evil.com",
      "/\\evil.com",
      "javascript:alert(1)",
    ]) {
      expect(safeRedirect(hostile), hostile).toBe(DEFAULT_SIGNED_IN_ROUTE);
    }
  });
});
