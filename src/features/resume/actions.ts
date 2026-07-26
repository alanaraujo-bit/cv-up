"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ResumeStatus } from "@/generated/prisma/enums";
import { authActionClient } from "@/server/safe-action";

import { resumeDocumentSchema } from "./schemas/document";
import {
  createResume,
  renameResume,
  saveResumeDocument,
  setResumeStatus,
  softDeleteResume,
} from "./service";

const resumeId = z.string().min(1);

const NOT_FOUND = "Currículo não encontrado.";

export const createResumeAction = authActionClient
  .inputSchema(
    z.object({
      title: z.string().trim().min(1, "Dê um nome ao currículo.").max(120),
      templateId: z.string().min(1, "Escolha um modelo."),
      fullName: z.string().trim().max(120).default(""),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const id = await createResume(ctx.userId, parsedInput);
    revalidatePath("/curriculos");
    revalidatePath("/painel");
    return { id };
  });

export const saveResumeDocumentAction = authActionClient
  .inputSchema(z.object({ resumeId, document: resumeDocumentSchema }))
  .action(async ({ parsedInput, ctx }) => {
    const saved = await saveResumeDocument(
      ctx.userId,
      parsedInput.resumeId,
      parsedInput.document,
    );
    if (!saved) throw new Error(NOT_FOUND);

    // The editor drives its own state; only the lists need refreshing.
    revalidatePath("/curriculos");
    revalidatePath("/painel");
    return { savedAt: new Date().toISOString() };
  });

export const renameResumeAction = authActionClient
  .inputSchema(
    z.object({
      resumeId,
      title: z.string().trim().min(1, "Dê um nome ao currículo.").max(120),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const renamed = await renameResume(
      ctx.userId,
      parsedInput.resumeId,
      parsedInput.title,
    );
    if (!renamed) throw new Error(NOT_FOUND);

    revalidatePath("/curriculos");
    return { title: parsedInput.title };
  });

export const setResumeStatusAction = authActionClient
  .inputSchema(z.object({ resumeId, status: z.enum(ResumeStatus) }))
  .action(async ({ parsedInput, ctx }) => {
    const updated = await setResumeStatus(
      ctx.userId,
      parsedInput.resumeId,
      parsedInput.status,
    );
    if (!updated) throw new Error(NOT_FOUND);

    revalidatePath("/curriculos");
    revalidatePath("/painel");
    return { status: parsedInput.status };
  });

export const deleteResumeAction = authActionClient
  .inputSchema(z.object({ resumeId }))
  .action(async ({ parsedInput, ctx }) => {
    const deleted = await softDeleteResume(ctx.userId, parsedInput.resumeId);
    if (!deleted) throw new Error(NOT_FOUND);

    revalidatePath("/curriculos");
    revalidatePath("/painel");
    return { deleted: true };
  });
