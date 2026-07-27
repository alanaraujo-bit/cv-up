import { NextResponse, type NextRequest } from "next/server";

import { getRenderableExport } from "@/features/export/render-access";
import { getResumeForUser } from "@/features/resume/service";
import { verifyRenderToken } from "@/server/render-token";
import { getPrivateObject } from "@/server/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The résumé photo, for the headless renderer.
 *
 * The editor's photo route authenticates with a session cookie, which a
 * headless browser printing `/render/[token]` does not have. Rather than
 * loosening that route, this one accepts the same render token as the page that
 * embeds it — so the photo is reachable exactly as long as the render is.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const payload = verifyRenderToken(decodeURIComponent(token));
  if (!payload) return new NextResponse(null, { status: 404 });

  const claim = await getRenderableExport(payload);
  if (!claim) return new NextResponse(null, { status: 404 });

  const resume = await getResumeForUser(payload.userId, payload.resumeId);
  const photo = resume?.document.personal.photo;
  if (!photo) return new NextResponse(null, { status: 404 });

  const object = await getPrivateObject(photo.pathname);
  if (!object) return new NextResponse(null, { status: 404 });

  return new NextResponse(object.stream, {
    headers: {
      "Content-Type": object.headers.get("content-type") ?? "image/webp",
      "Cache-Control": "no-store",
    },
  });
}
