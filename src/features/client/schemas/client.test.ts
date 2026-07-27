import { describe, expect, it } from "vitest";

import { ClientStatus } from "@/generated/prisma/enums";

import {
  CLIENT_BOARD_STATUSES,
  CLIENT_STATUS_LABEL,
  clientInputSchema,
  isBoardStatus,
} from "./client";

const parse = (input: Record<string, unknown>) =>
  clientInputSchema.parse({ name: "Maria", ...input });

describe("clientInputSchema", () => {
  it("requires only a name", () => {
    expect(parse({})).toEqual({
      name: "Maria",
      email: null,
      phone: null,
      city: null,
      notes: null,
      status: ClientStatus.NEW_REQUEST,
    });
  });

  it("rejects a blank name", () => {
    expect(clientInputSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("stores an untouched field as null, never as an empty string", () => {
    // Otherwise "" and null both mean "not filled in" and every read has to
    // check for both.
    const parsed = parse({ email: "", phone: "  ", city: "", notes: "" });

    expect(parsed.email).toBeNull();
    expect(parsed.phone).toBeNull();
    expect(parsed.city).toBeNull();
    expect(parsed.notes).toBeNull();
  });

  it("validates an e-mail only when one was typed", () => {
    expect(parse({ email: "maria@exemplo.com" }).email).toBe(
      "maria@exemplo.com",
    );
    expect(
      clientInputSchema.safeParse({ name: "M", email: "nope" }).success,
    ).toBe(false);
    expect(clientInputSchema.safeParse({ name: "M", email: "" }).success).toBe(
      true,
    );
  });

  it("trims what it stores", () => {
    expect(parse({ city: "  Contagem  " }).city).toBe("Contagem");
    expect(clientInputSchema.parse({ name: "  Maria  " }).name).toBe("Maria");
  });

  it("caps the fields a person could paste a novel into", () => {
    expect(
      clientInputSchema.safeParse({ name: "M", notes: "x".repeat(2001) })
        .success,
    ).toBe(false);
    expect(clientInputSchema.safeParse({ name: "x".repeat(121) }).success).toBe(
      false,
    );
  });
});

describe("the board", () => {
  it("keeps archived clients off it", () => {
    expect(isBoardStatus(ClientStatus.ARCHIVED)).toBe(false);
    expect(CLIENT_BOARD_STATUSES).not.toContain(ClientStatus.ARCHIVED);
  });

  it("runs request to delivery, in that order", () => {
    expect(CLIENT_BOARD_STATUSES).toEqual([
      ClientStatus.NEW_REQUEST,
      ClientStatus.WAITING_INFO,
      ClientStatus.IN_PROGRESS,
      ClientStatus.DELIVERED,
    ]);
  });

  it("names every status, including the one off the board", () => {
    for (const status of Object.values(ClientStatus)) {
      expect(CLIENT_STATUS_LABEL[status]).toBeTruthy();
    }
  });
});
