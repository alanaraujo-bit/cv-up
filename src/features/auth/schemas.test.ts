import { describe, expect, it } from "vitest";

import { signInSchema, signUpSchema } from "./schemas";

describe("signInSchema", () => {
  it("normalises the e-mail so casing and stray spaces never block sign-in", () => {
    const result = signInSchema.parse({
      email: "  Maria@Exemplo.COM  ",
      password: "qualquer",
    });
    expect(result.email).toBe("maria@exemplo.com");
  });

  it("rejects a malformed e-mail", () => {
    expect(
      signInSchema.safeParse({ email: "maria@", password: "12345678" }).success,
    ).toBe(false);
  });
});

describe("signUpSchema", () => {
  const valid = {
    name: "Maria Silva",
    email: "maria@exemplo.com",
    password: "senhaforte1",
    confirmPassword: "senhaforte1",
  };

  it("accepts a well-formed registration", () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it("reports mismatched passwords on the confirmation field", () => {
    const result = signUpSchema.safeParse({
      ...valid,
      confirmPassword: "outracoisa",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
  });

  it("enforces the minimum password length", () => {
    const result = signUpSchema.safeParse({
      ...valid,
      password: "curta1",
      confirmPassword: "curta1",
    });
    expect(result.success).toBe(false);
  });
});
