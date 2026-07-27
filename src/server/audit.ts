import "server-only";

import type { AuditAction } from "@/generated/prisma/enums";
import { db } from "@/server/db";

/**
 * Append-only record of what happened to a row.
 *
 * This user works with other people's data, so "when did this change, and to
 * what" is a real question they will need answered — the client timeline is
 * built entirely from these rows rather than from a second bespoke table.
 *
 * Writing an audit entry must never be able to fail the operation it describes:
 * a lost log line is a smaller problem than a status change that gets rolled
 * back because logging it failed.
 */
export async function recordAudit(input: {
  actorId: string;
  entity: string;
  entityId: string;
  action: AuditAction;
  diff?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        actorId: input.actorId,
        entity: input.entity,
        entityId: input.entityId,
        action: input.action,
        diff: input.diff ? (input.diff as never) : undefined,
      },
    });
  } catch (error) {
    console.error(
      "[audit] could not record",
      input.entity,
      input.entityId,
      error,
    );
  }
}
