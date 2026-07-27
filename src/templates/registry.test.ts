import { describe, expect, it } from "vitest";

import {
  getTemplateEngine,
  isRenderableEngine,
  RENDERABLE_ENGINE_KEYS,
} from "./registry";

describe("template registry", () => {
  it("exposes the three engines phase 4 ships", () => {
    expect(RENDERABLE_ENGINE_KEYS).toEqual([
      "moderno",
      "executivo",
      "minimalista",
    ]);
  });

  it("has no duplicate keys — a collision would silently shadow a template", () => {
    expect(new Set(RENDERABLE_ENGINE_KEYS).size).toBe(
      RENDERABLE_ENGINE_KEYS.length,
    );
  });

  it("resolves each engine under the key it declares", () => {
    for (const key of RENDERABLE_ENGINE_KEYS) {
      expect(getTemplateEngine(key)?.key).toBe(key);
    }
  });

  it("returns null for a template whose engine does not exist yet", () => {
    // Seeded, but not built until phase 8.
    expect(getTemplateEngine("tecnologia")).toBeNull();
    expect(isRenderableEngine("tecnologia")).toBe(false);
    expect(getTemplateEngine(null)).toBeNull();
    expect(getTemplateEngine("")).toBeNull();
  });

  it("gives every engine a theme the paper token layer can consume", () => {
    for (const key of RENDERABLE_ENGINE_KEYS) {
      const engine = getTemplateEngine(key)!;
      expect(engine.theme.accent).toMatch(/^oklch\(/);
      expect(engine.theme.marginX).toMatch(/mm$/);
      expect(engine.theme.baseSize).toMatch(/pt$/);
      expect(engine.theme.leading).toBeGreaterThan(1);
    }
  });
});
