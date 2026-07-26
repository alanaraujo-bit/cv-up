import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { ResumeStatus } from "@/generated/prisma/enums";
import { db } from "@/server/db";

import {
  CURRENT_SCHEMA_VERSION,
  createEmptyDocument,
  parseStoredDocument,
  type ResumeDocument,
} from "./schemas/document";

export interface ResumeListItem {
  id: string;
  title: string;
  status: ResumeStatus;
  templateName: string;
  clientName: string | null;
  lastEditedAt: Date;
}

export interface ResumeEditorData {
  id: string;
  title: string;
  status: ResumeStatus;
  templateId: string;
  clientId: string | null;
  document: ResumeDocument;
  lastEditedAt: Date;
}

const toJson = (document: ResumeDocument): Prisma.InputJsonValue =>
  document as unknown as Prisma.InputJsonValue;

export async function listResumes(userId: string): Promise<ResumeListItem[]> {
  const rows = await db.resume.findMany({
    where: { userId, deletedAt: null },
    orderBy: { lastEditedAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      lastEditedAt: true,
      template: { select: { name: true } },
      client: { select: { name: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    templateName: row.template.name,
    clientName: row.client?.name ?? null,
    lastEditedAt: row.lastEditedAt,
  }));
}

/**
 * The only way to read a resume for editing. Ownership is part of the `where`
 * clause rather than a check afterwards, so a wrong id is indistinguishable
 * from someone else's id.
 */
export async function getResumeForUser(
  userId: string,
  resumeId: string,
): Promise<ResumeEditorData | null> {
  const row = await db.resume.findFirst({
    where: { id: resumeId, userId, deletedAt: null },
    select: {
      id: true,
      title: true,
      status: true,
      templateId: true,
      clientId: true,
      content: true,
      lastEditedAt: true,
    },
  });

  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    status: row.status,
    templateId: row.templateId,
    clientId: row.clientId,
    document: parseStoredDocument(row.content),
    lastEditedAt: row.lastEditedAt,
  };
}

export async function createResume(
  userId: string,
  input: { title: string; templateId: string; fullName: string },
): Promise<string> {
  // Guard the foreign key here so an inactive or bogus template id surfaces as
  // a validation failure rather than a database error.
  const template = await db.template.findFirst({
    where: { id: input.templateId, isActive: true },
    select: { id: true },
  });
  if (!template) throw new Error("TEMPLATE_NOT_FOUND");

  const resume = await db.resume.create({
    data: {
      userId,
      templateId: template.id,
      title: input.title,
      status: ResumeStatus.DRAFT,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      content: toJson(createEmptyDocument(input.fullName)),
    },
    select: { id: true },
  });

  return resume.id;
}

/** Returns false when the resume does not belong to the user. */
export async function saveResumeDocument(
  userId: string,
  resumeId: string,
  document: ResumeDocument,
): Promise<boolean> {
  const { count } = await db.resume.updateMany({
    where: { id: resumeId, userId, deletedAt: null },
    data: {
      content: toJson(document),
      schemaVersion: document.schemaVersion,
      lastEditedAt: new Date(),
      // A resume with a name has moved past "blank draft".
      status:
        document.personal.fullName.length > 0
          ? ResumeStatus.IN_PROGRESS
          : ResumeStatus.DRAFT,
    },
  });

  return count > 0;
}

export async function renameResume(
  userId: string,
  resumeId: string,
  title: string,
): Promise<boolean> {
  const { count } = await db.resume.updateMany({
    where: { id: resumeId, userId, deletedAt: null },
    data: { title },
  });
  return count > 0;
}

export async function setResumeStatus(
  userId: string,
  resumeId: string,
  status: ResumeStatus,
): Promise<boolean> {
  const { count } = await db.resume.updateMany({
    where: { id: resumeId, userId, deletedAt: null },
    data: { status },
  });
  return count > 0;
}

export async function softDeleteResume(
  userId: string,
  resumeId: string,
): Promise<boolean> {
  const { count } = await db.resume.updateMany({
    where: { id: resumeId, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return count > 0;
}
