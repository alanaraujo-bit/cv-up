import { z } from "zod";

/**
 * Months are stored as `YYYY-MM` so they sort as strings, and presented as
 * `MM/AAAA`, which is what a Brazilian resume shows. The empty string means
 * "not filled in yet" — see the note on permissiveness in `document.ts`.
 */
export const monthYear = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use o formato MM/AAAA.");

export const storedMonthYear = z
  .union([monthYear, z.literal("")])
  .catch("")
  .default("");

export type MonthYear = z.infer<typeof monthYear>;

export function formatMonthYear(value: string | null | undefined): string {
  if (!value) return "";
  const [year, month] = value.split("-");
  return year && month ? `${month}/${year}` : "";
}

/** Parses `MM/AAAA` (or `MMAAAA`) into storage form; empty string when invalid. */
export function parseMonthYear(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length !== 6) return "";
  const month = digits.slice(0, 2);
  const year = digits.slice(2);
  if (Number(month) < 1 || Number(month) > 12) return "";
  return `${year}-${month}`;
}

/** Trimmed, length-capped free text. Empty means "not filled in". */
export const storedText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres.`)
    .catch("")
    .default("");

/**
 * A URL the user may type without a scheme. Stored as typed; normalised to
 * `https://` only when it already looks like a URL.
 */
export const storedUrl = (max = 300) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) =>
      value.length > 0 && !/^https?:\/\//i.test(value)
        ? `https://${value}`
        : value,
    )
    .catch("")
    .default("");

export const entityId = z.string().min(1);

/** Ids only need to be unique inside one document. */
export function newId(): string {
  return crypto.randomUUID();
}

export function isValidUrl(value: string): boolean {
  return z.url().safeParse(value).success;
}

export function isValidEmail(value: string): boolean {
  return z.email().safeParse(value).success;
}
