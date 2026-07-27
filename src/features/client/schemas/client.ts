import { z } from "zod";

import { ClientStatus } from "@/generated/prisma/enums";

/**
 * Unlike the résumé document, a client record is validated strictly: it is
 * filled in by hand, in one go, from a form — there is no autosave mid-word to
 * protect (see the note on permissiveness in `resume/schemas/document.ts`).
 * Only the name is required, because that is genuinely all you know when
 * somebody first messages you.
 */

/** Optional free text: an empty field is stored as null, never as "". */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres.`)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .default(null);

export const clientInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome do cliente.")
    .max(120, "Use no máximo 120 caracteres."),
  email: z
    .string()
    .trim()
    .max(120)
    .refine(
      (value) => value.length === 0 || z.email().safeParse(value).success,
      "E-mail inválido.",
    )
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .default(null),
  phone: optionalText(20),
  city: optionalText(80),
  notes: optionalText(2000),
  status: z.enum(ClientStatus).default(ClientStatus.NEW_REQUEST),
});

export type ClientInput = z.infer<typeof clientInputSchema>;

export const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  NEW_REQUEST: "Novo pedido",
  WAITING_INFO: "Aguardando dados",
  IN_PROGRESS: "Em andamento",
  DELIVERED: "Entregue",
  ARCHIVED: "Arquivado",
};

/**
 * The board, left to right. `ARCHIVED` is deliberately not a column: archiving
 * is how a client leaves the board, and a fifth column of finished work would
 * grow without bound and make the useful columns narrower every month.
 */
export const CLIENT_BOARD_STATUSES = [
  ClientStatus.NEW_REQUEST,
  ClientStatus.WAITING_INFO,
  ClientStatus.IN_PROGRESS,
  ClientStatus.DELIVERED,
] as const;

export type BoardStatus = (typeof CLIENT_BOARD_STATUSES)[number];

export function isBoardStatus(status: ClientStatus): status is BoardStatus {
  return (CLIENT_BOARD_STATUSES as readonly ClientStatus[]).includes(status);
}
