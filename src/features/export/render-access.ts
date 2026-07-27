import "server-only";

import { ExportStatus } from "@/generated/prisma/enums";
import { db } from "@/server/db";
import type { RenderTokenPayload } from "@/server/render-token";

/**
 * Confirms a render token still refers to work in progress.
 *
 * A valid signature only proves the token was issued by us. This is the second
 * half of the check: the export it names must still be the one being rendered.
 * Tokens are minted by the claim endpoint, so `PROCESSING` is the only status
 * that can legitimately be reading this page — the moment the renderer reports
 * back, the token stops opening anything.
 */
export async function getRenderableExport(
  payload: RenderTokenPayload,
): Promise<{ exportId: string } | null> {
  const row = await db.exportHistory.findFirst({
    where: {
      id: payload.exportId,
      resumeId: payload.resumeId,
      userId: payload.userId,
      status: ExportStatus.PROCESSING,
    },
    select: { id: true },
  });

  return row ? { exportId: row.id } : null;
}
