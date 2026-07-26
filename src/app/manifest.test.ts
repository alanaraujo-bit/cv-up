import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import manifest from "./manifest";

/**
 * Installability breaks silently: the browser just stops offering "install".
 * These assertions cover the conditions Chrome and Safari actually check.
 */
describe("web app manifest", () => {
  const result = manifest();

  it("declares the fields required for installability", () => {
    expect(result.name).toBeTruthy();
    expect(result.short_name).toBeTruthy();
    expect(result.start_url).toBe("/");
    expect(result.display).toBe("standalone");
    expect(result.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("ships both a standard and a maskable icon of at least 192px", () => {
    const icons = result.icons ?? [];
    const sized = (purpose: string | undefined) =>
      icons.filter((icon) => icon.purpose === purpose);

    expect(sized(undefined).length).toBeGreaterThan(0);
    expect(sized("maskable").length).toBeGreaterThan(0);
    expect(icons.some((icon) => icon.sizes === "512x512")).toBe(true);
  });

  it("points every icon at a file that exists", () => {
    for (const icon of result.icons ?? []) {
      const file = path.join(process.cwd(), "public", icon.src);
      expect(existsSync(file), `missing icon: ${icon.src}`).toBe(true);
    }
  });
});
