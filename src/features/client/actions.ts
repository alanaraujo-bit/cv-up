"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ClientStatus } from "@/generated/prisma/enums";
import { authActionClient } from "@/server/safe-action";

import { clientInputSchema } from "./schemas/client";
import {
  createClient,
  setClientStatus,
  setResumeClient,
  softDeleteClient,
  updateClient,
} from "./service";

const clientId = z.string().min(1);
const NOT_FOUND = "Cliente não encontrado.";

export const createClientAction = authActionClient
  .inputSchema(clientInputSchema)
  .action(async ({ parsedInput, ctx }) => {
    const id = await createClient(ctx.userId, parsedInput);

    revalidatePath("/clientes");
    revalidatePath("/painel");
    return { id };
  });

export const updateClientAction = authActionClient
  .inputSchema(z.object({ clientId, data: clientInputSchema }))
  .action(async ({ parsedInput, ctx }) => {
    const updated = await updateClient(
      ctx.userId,
      parsedInput.clientId,
      parsedInput.data,
    );
    if (!updated) throw new Error(NOT_FOUND);

    revalidatePath("/clientes");
    revalidatePath(`/clientes/${parsedInput.clientId}`);
    return { ok: true };
  });

export const setClientStatusAction = authActionClient
  .inputSchema(z.object({ clientId, status: z.enum(ClientStatus) }))
  .action(async ({ parsedInput, ctx }) => {
    const moved = await setClientStatus(
      ctx.userId,
      parsedInput.clientId,
      parsedInput.status,
    );
    if (!moved) throw new Error(NOT_FOUND);

    revalidatePath("/clientes");
    revalidatePath(`/clientes/${parsedInput.clientId}`);
    return { status: parsedInput.status };
  });

export const deleteClientAction = authActionClient
  .inputSchema(z.object({ clientId }))
  .action(async ({ parsedInput, ctx }) => {
    const deleted = await softDeleteClient(ctx.userId, parsedInput.clientId);
    if (!deleted) throw new Error(NOT_FOUND);

    revalidatePath("/clientes");
    revalidatePath("/painel");
    return { deleted: true };
  });

export const setResumeClientAction = authActionClient
  .inputSchema(
    z.object({
      resumeId: z.string().min(1),
      // Empty string is how a `<select>` says "nobody".
      clientId: z.string().transform((value) => (value === "" ? null : value)),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const linked = await setResumeClient(
      ctx.userId,
      parsedInput.resumeId,
      parsedInput.clientId,
    );
    if (!linked) throw new Error("Não foi possível vincular o currículo.");

    revalidatePath("/curriculos");
    revalidatePath("/clientes");
    return { clientId: parsedInput.clientId };
  });
