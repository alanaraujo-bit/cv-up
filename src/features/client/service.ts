import "server-only";

import {
  AuditAction,
  ClientStatus,
  type ResumeStatus,
} from "@/generated/prisma/enums";
import { db } from "@/server/db";
import { recordAudit } from "@/server/audit";

import type { ClientInput } from "./schemas/client";

export interface ClientCard {
  id: string;
  name: string;
  city: string | null;
  status: ClientStatus;
  resumeCount: number;
  updatedAt: Date;
}

export interface ClientDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  status: ClientStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  resumes: {
    id: string;
    title: string;
    status: ResumeStatus;
    templateName: string;
    lastEditedAt: Date;
  }[];
}

const cardSelect = {
  id: true,
  name: true,
  city: true,
  status: true,
  updatedAt: true,
  _count: { select: { resumes: { where: { deletedAt: null } } } },
} as const;

type CardRow = {
  id: string;
  name: string;
  city: string | null;
  status: ClientStatus;
  updatedAt: Date;
  _count: { resumes: number };
};

const toCard = (row: CardRow): ClientCard => ({
  id: row.id,
  name: row.name,
  city: row.city,
  status: row.status,
  resumeCount: row._count.resumes,
  updatedAt: row.updatedAt,
});

/**
 * Everything on the board. Ordered oldest-touched first inside each column:
 * the request that has been sitting longest is the one at risk of being
 * forgotten, so it belongs at the top rather than buried under today's work.
 */
export async function listBoardClients(userId: string): Promise<ClientCard[]> {
  const rows = await db.client.findMany({
    where: {
      userId,
      deletedAt: null,
      status: { not: ClientStatus.ARCHIVED },
    },
    orderBy: { updatedAt: "asc" },
    select: cardSelect,
  });

  return rows.map(toCard);
}

export async function listArchivedClients(
  userId: string,
): Promise<ClientCard[]> {
  const rows = await db.client.findMany({
    where: { userId, deletedAt: null, status: ClientStatus.ARCHIVED },
    orderBy: { updatedAt: "desc" },
    select: cardSelect,
  });

  return rows.map(toCard);
}

/** For the résumé editor's client picker — name and id, nothing more. */
export async function listClientOptions(
  userId: string,
): Promise<{ id: string; name: string }[]> {
  return db.client.findMany({
    where: { userId, deletedAt: null, status: { not: ClientStatus.ARCHIVED } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function getClientForUser(
  userId: string,
  clientId: string,
): Promise<ClientDetail | null> {
  const row = await db.client.findFirst({
    where: { id: clientId, userId, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      status: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      resumes: {
        where: { deletedAt: null },
        orderBy: { lastEditedAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          lastEditedAt: true,
          template: { select: { name: true } },
        },
      },
    },
  });

  if (!row) return null;

  return {
    ...row,
    resumes: row.resumes.map((resume) => ({
      id: resume.id,
      title: resume.title,
      status: resume.status,
      templateName: resume.template.name,
      lastEditedAt: resume.lastEditedAt,
    })),
  };
}

export async function createClient(
  userId: string,
  input: ClientInput,
): Promise<string> {
  const client = await db.client.create({
    data: { ...input, userId },
    select: { id: true },
  });

  await recordAudit({
    actorId: userId,
    entity: "Client",
    entityId: client.id,
    action: AuditAction.CREATE,
    diff: { name: input.name, status: input.status },
  });

  return client.id;
}

/**
 * Returns false when the client is not the user's — indistinguishable, on
 * purpose, from one that does not exist.
 */
export async function updateClient(
  userId: string,
  clientId: string,
  input: ClientInput,
): Promise<boolean> {
  const before = await db.client.findFirst({
    where: { id: clientId, userId, deletedAt: null },
    select: {
      name: true,
      email: true,
      phone: true,
      city: true,
      notes: true,
      status: true,
    },
  });
  if (!before) return false;

  const { count } = await db.client.updateMany({
    where: { id: clientId, userId, deletedAt: null },
    data: input,
  });
  if (count === 0) return false;

  // Only what actually moved, so the timeline reads as a list of changes
  // rather than a dump of the whole record on every save.
  const changed: Record<string, unknown> = {};
  for (const key of Object.keys(input) as (keyof ClientInput)[]) {
    if (before[key] !== input[key]) {
      changed[key] = { from: before[key], to: input[key] };
    }
  }

  if (Object.keys(changed).length > 0) {
    await recordAudit({
      actorId: userId,
      entity: "Client",
      entityId: clientId,
      action: AuditAction.UPDATE,
      diff: changed,
    });
  }

  return true;
}

/** Moving a card on the board. Recorded so the timeline shows the workflow. */
export async function setClientStatus(
  userId: string,
  clientId: string,
  status: ClientStatus,
): Promise<boolean> {
  const before = await db.client.findFirst({
    where: { id: clientId, userId, deletedAt: null },
    select: { status: true },
  });
  if (!before) return false;
  if (before.status === status) return true;

  const { count } = await db.client.updateMany({
    where: { id: clientId, userId, deletedAt: null },
    data: { status },
  });
  if (count === 0) return false;

  await recordAudit({
    actorId: userId,
    entity: "Client",
    entityId: clientId,
    action: AuditAction.UPDATE,
    diff: { status: { from: before.status, to: status } },
  });

  return true;
}

export async function softDeleteClient(
  userId: string,
  clientId: string,
): Promise<boolean> {
  const { count } = await db.client.updateMany({
    where: { id: clientId, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (count === 0) return false;

  // Résumés keep their `clientId`: the work was still done for that person, and
  // the client is only soft-deleted, so unlinking would lose that fact.
  await recordAudit({
    actorId: userId,
    entity: "Client",
    entityId: clientId,
    action: AuditAction.DELETE,
  });

  return true;
}

export interface TimelineEntry {
  id: string;
  action: AuditAction;
  diff: Record<string, unknown> | null;
  createdAt: Date;
}

/**
 * The client's history, newest first.
 *
 * Ownership is checked on the *client* before the log is read, because
 * `AuditLog` rows are not themselves scoped to a user — reading them by
 * `entityId` alone would be a way to see somebody else's history.
 */
export async function getClientTimeline(
  userId: string,
  clientId: string,
  take = 50,
): Promise<TimelineEntry[]> {
  const owns = await db.client.findFirst({
    where: { id: clientId, userId },
    select: { id: true },
  });
  if (!owns) return [];

  const rows = await db.auditLog.findMany({
    where: { entity: "Client", entityId: clientId },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, action: true, diff: true, createdAt: true },
  });

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    diff: (row.diff as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt,
  }));
}

/** Attaches a résumé to a client, or detaches it when `clientId` is null. */
export async function setResumeClient(
  userId: string,
  resumeId: string,
  clientId: string | null,
): Promise<boolean> {
  if (clientId !== null) {
    const client = await db.client.findFirst({
      where: { id: clientId, userId, deletedAt: null },
      select: { id: true },
    });
    if (!client) return false;
  }

  const { count } = await db.resume.updateMany({
    where: { id: resumeId, userId, deletedAt: null },
    data: { clientId },
  });

  return count > 0;
}
