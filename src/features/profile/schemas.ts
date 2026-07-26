import { z } from "zod";

const optionalText = (max: number, message: string) =>
  z
    .string()
    .max(max, message)
    .transform((value) => value.trim())
    .transform((value) => (value.length === 0 ? null : value))
    .nullable();

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Informe seu nome.")
    .max(80, "Nome muito longo.")
    .transform((value) => value.trim()),
  displayName: optionalText(80, "Nome de exibição muito longo."),
  headline: optionalText(120, "Use no máximo 120 caracteres."),
  city: optionalText(80, "Cidade muito longa."),
  phone: z
    .string()
    .max(20, "Telefone muito longo.")
    .transform((value) => value.trim())
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .refine(
      (value) => value === null || /^[\d\s()+-]{10,20}$/.test(value),
      "Telefone inválido.",
    ),
});

export type UpdateProfileInput = z.input<typeof updateProfileSchema>;
export type UpdateProfileValues = z.output<typeof updateProfileSchema>;
