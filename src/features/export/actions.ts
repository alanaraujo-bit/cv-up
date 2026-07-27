"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { authActionClient } from "@/server/safe-action";
import { isPdfExportConfigured } from "@/server/worker-auth";

import { requestExport } from "./service";

export const requestExportAction = authActionClient
  .inputSchema(z.object({ resumeId: z.string().min(1) }))
  .action(async ({ parsedInput, ctx }) => {
    // The button is not rendered without a renderer, but an action is a public
    // endpoint: it cannot rely on the UI having hidden itself.
    if (!isPdfExportConfigured()) {
      throw new Error("A exportação em PDF ainda não está disponível.");
    }

    const record = await requestExport(ctx.userId, parsedInput.resumeId);
    if (!record) throw new Error("Currículo não encontrado.");

    revalidatePath("/curriculos");
    return { exportId: record.id, status: record.status };
  });
