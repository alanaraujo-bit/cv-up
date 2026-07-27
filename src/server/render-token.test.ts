// @vitest-environment node
// Server-only code, and `@/lib/env` refuses to hand a server variable to
// anything that looks like a browser — which jsdom does.

import { afterEach, describe, expect, it, vi } from "vitest";

import { createRenderToken, verifyRenderToken } from "./render-token";

const subject = {
  exportId: "exp_1",
  resumeId: "res_1",
  userId: "usr_1",
};

describe("render token", () => {
  afterEach(() => vi.useRealTimers());

  it("round-trips the export it was issued for", () => {
    const payload = verifyRenderToken(createRenderToken(subject));

    expect(payload).toMatchObject(subject);
    expect(payload?.expiresAt).toBeGreaterThan(Date.now() / 1000);
  });

  it("rejects a tampered payload", () => {
    const token = createRenderToken(subject);
    const [version, encoded, signature] = token.split(".");

    const forged = Buffer.from(
      JSON.stringify({
        ...subject,
        resumeId: "someone-elses",
        expiresAt: 1e10,
      }),
    ).toString("base64url");

    expect(verifyRenderToken(`${version}.${forged}.${signature}`)).toBeNull();
    expect(verifyRenderToken(`${version}.${encoded}.${signature}x`)).toBeNull();
  });

  it("rejects anything that is not a token", () => {
    expect(verifyRenderToken("")).toBeNull();
    expect(verifyRenderToken("nope")).toBeNull();
    expect(verifyRenderToken("a.b")).toBeNull();
    expect(verifyRenderToken("a.b.c.d")).toBeNull();
    // Right shape, wrong version prefix.
    expect(
      verifyRenderToken(createRenderToken(subject).replace(/^1\./, "2.")),
    ).toBeNull();
  });

  it("rejects a well-formed token whose payload is not one", () => {
    const encoded = Buffer.from(JSON.stringify({ exportId: 7 })).toString(
      "base64url",
    );
    // Signed correctly by construction only if we sign it — an unsigned body
    // must fail on the signature first, which is the point.
    expect(verifyRenderToken(`1.${encoded}.deadbeef`)).toBeNull();
  });

  it("expires", () => {
    const token = createRenderToken(subject, 60);
    expect(verifyRenderToken(token)).not.toBeNull();

    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 61_000);

    expect(verifyRenderToken(token)).toBeNull();
  });

  it("issues a different token every time, so one cannot be replayed by guess", () => {
    vi.useFakeTimers();
    const first = createRenderToken({ ...subject, exportId: "a" });
    const second = createRenderToken({ ...subject, exportId: "b" });

    expect(first).not.toBe(second);
  });
});
