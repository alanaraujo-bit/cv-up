/**
 * Better Auth returns English error codes. Anything not mapped here falls back
 * to a generic message rather than leaking internals to the user.
 */
const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou senha incorretos.",
  INVALID_EMAIL: "E-mail inválido.",
  INVALID_PASSWORD: "Senha incorreta.",
  USER_ALREADY_EXISTS: "Já existe uma conta com este e-mail.",
  USER_NOT_FOUND: "Não encontramos uma conta com este e-mail.",
  EMAIL_NOT_VERIFIED: "Confirme seu e-mail para entrar.",
  PASSWORD_TOO_SHORT: "A senha precisa de pelo menos 8 caracteres.",
  PASSWORD_TOO_LONG: "A senha pode ter no máximo 128 caracteres.",
  CREDENTIAL_ACCOUNT_NOT_FOUND:
    "Esta conta foi criada com o Google. Entre pelo Google.",
  SESSION_EXPIRED: "Sua sessão expirou. Entre novamente.",
  TOO_MANY_REQUESTS: "Muitas tentativas. Aguarde um instante e tente de novo.",
};

export function authErrorMessage(code?: string | null): string {
  if (code && code in MESSAGES) return MESSAGES[code]!;
  return "Não foi possível concluir. Tente novamente em instantes.";
}
