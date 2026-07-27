import { NextResponse } from "next/server";

import { claimNextExport } from "@/features/export/service";
import { env } from "@/lib/env";
import {
  createRenderToken,
  RENDER_TOKEN_TTL_SECONDS,
} from "@/server/render-token";
import { isWorkerRequest } from "@/server/worker-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The renderer asks for work here.
 *
 * Work is pulled rather than pushed (ADR 0008): the app never needs to know
 * where the renderer is, and a renderer that dies mid-job leaves a row that the
 * next poll reclaims. 204 means the queue is empty, which is the normal answer.
 */
export async function POST(request: Request) {
  if (!isWorkerRequest(request)) {
    return new NextResponse(null, { status: 404 });
  }

  const claimed = await claimNextExport();
  if (!claimed) return new NextResponse(null, { status: 204 });

  const token = createRenderToken({
    exportId: claimed.exportId,
    resumeId: claimed.resumeId,
    userId: claimed.userId,
  });

  return NextResponse.json({
    exportId: claimed.exportId,
    attempt: claimed.attempt,
    renderUrl: `${env.NEXT_PUBLIC_APP_URL}/render/${encodeURIComponent(token)}`,
    expiresInSeconds: RENDER_TOKEN_TTL_SECONDS,
  });
}
