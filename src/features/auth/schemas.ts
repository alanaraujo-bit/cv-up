import { z } from "zod";

/** Messages are user-facing, so they are written in Portuguese. */
const email = z
  .string()
  // Trim before validating: mobile keyboards and autofill routinely append a
  // trailing space, and rejecting that as "invalid e-mail" is indefensible.
  .trim()
  .min(1, "Informe seu e-mail.")
  .pipe(z.email("E-mail inválido."))
  .transform((value) => value.toLowerCase());

const password = z
  .string()
  .min(8, "A senha precisa de pelo menos 8 caracteres.")
  .max(128, "A senha pode ter no máximo 128 caracteres.");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Informe sua senha."),
});

export const signUpSchema = z
  .object({
    name: z
      .string()
      .min(2, "Informe seu nome.")
      .max(80, "Nome muito longo.")
      .transform((value) => value.trim()),
    email,
    password,
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
