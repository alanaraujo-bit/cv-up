import { describe, expect, it } from "vitest";

import { BOTTOM_NAV_ITEMS, NAV_ITEMS, isNavItemActive } from "./navigation";

describe("isNavItemActive", () => {
  it("matches /painel exactly so it does not light up everywhere", () => {
    expect(isNavItemActive("/painel", "/painel")).toBe(true);
    expect(isNavItemActive("/curriculos", "/painel")).toBe(false);
    expect(isNavItemActive("/painel/qualquer", "/painel")).toBe(false);
  });

  it("keeps the section active on its own child routes", () => {
    expect(isNavItemActive("/curriculos", "/curriculos")).toBe(true);
    expect(isNavItemActive("/curriculos/abc/editor", "/curriculos")).toBe(true);
  });

  it("does not treat a prefix of another segment as a child", () => {
    // /clientes must not activate while visiting /clientes-antigos.
    expect(isNavItemActive("/clientes-antigos", "/clientes")).toBe(false);
  });
});

describe("navigation config", () => {
  it("keeps the mobile tab bar to four items", () => {
    expect(BOTTOM_NAV_ITEMS.length).toBeLessThanOrEqual(4);
  });

  it("has no duplicate destinations", () => {
    const hrefs = NAV_ITEMS.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
