import { NextResponse } from "next/server";

import { completeExport, failExport } from "@/features/export/service";
import { isWorkerRequest } from "@/server/worker-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Guards against a runaway body before any of it is read into memory. */
const MAX_BODY_BYTES = 25 * 1024 * 1024;

/**
 * The renderer reports a code, not a sentence. HTTP headers are not a safe
 * place for accented text, and the user-facing wording is the app's business —
 * the renderer has no idea it is talking to a Brazilian audience.
 */
const RENDER_ERRORS: Record<string, string> = {
  timeout: "A geração do PDF passou do tempo limite. Tente novamente.",
  unreachable: "Não foi possível abrir o currículo para impressão.",
  render_failed: "Não foi possível gerar o PDF. Tente novamente.",
};

const DEFAULT_ERROR = RENDER_ERRORS["render_failed"] ?? "Falha ao gerar o PDF.";

/**
 * The renderer hands back a finished PDF, or reports that it could not make
 * one. Both live here because they are the same transition from the queue's
 * point of view: this attempt is over.
 */
export async function POST(request: Request) {
  if (!isWorkerRequest(request)) {
    return new NextResponse(null, { status: 404 });
  }

  const exportId = request.headers.get("x-export-id");
  if (!exportId) {
    return NextResponse.json({ error: "missing_export_id" }, { status: 400 });
  }

  const failure = request.headers.get("x-export-error");
  if (failure) {
    await failExport(exportId, RENDER_ERRORS[failure] ?? DEFAULT_ERROR);
    return NextResponse.json({ ok: true, outcome: "failed" });
  }

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) {
    await failExport(exportId, "O PDF gerado passou do tamanho aceito.");
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  const pdf = Buffer.from(await request.arrayBuffer());

  // A count the renderer could not determine is recorded as unknown rather
  // than guessed at — the download works either way.
  const rawPageCount = Number(request.headers.get("x-page-count"));
  const pageCount =
    Number.isInteger(rawPageCount) && rawPageCount > 0 ? rawPageCount : null;

  const stored = await completeExport(exportId, pdf, pageCount);
  if (!stored) {
    return NextResponse.json({ error: "not_claimed" }, { status: 409 });
  }

  return NextResponse.json({ ok: true, outcome: "ready" });
}
