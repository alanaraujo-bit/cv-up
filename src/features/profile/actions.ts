"use server";

import { revalidatePath } from "next/cache";

import { authActionClient } from "@/server/safe-action";

import { updateProfileSchema } from "./schemas";
import { updateProfile } from "./service";

export const updateProfileAction = authActionClient
  .inputSchema(updateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    await updateProfile(ctx.userId, parsedInput);

    revalidatePath("/configuracoes");
    revalidatePath("/painel");

    return { message: "Perfil atualizado." };
  });
