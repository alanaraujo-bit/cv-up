import { notFound } from "next/navigation";

import { getResumeForUser } from "@/features/resume/service";
import { getRenderableExport } from "@/features/export/render-access";
import { PaperSheet } from "@/templates/paper/paper-sheet";
import { getTemplateEngine } from "@/templates/registry";
import { verifyRenderToken } from "@/server/render-token";

/** sharp and node:crypto both need the Node runtime. */
export const runtime = "nodejs";
/** Never cached: it serves one person's private résumé under a bearer token. */
export const dynamic = "force-dynamic";

/**
 * The page the PDF renderer prints (ADR 0002).
 *
 * It is the same `PaperSheet` the editor previews, printed under the same
 * stylesheet — that is the entire reason the preview can be trusted. The print
 * rules in `globals.css` collapse the on-screen sheets back into one flow and
 * let Chromium paginate it against the same `[data-block]` boundaries the
 * preview measured (ADR 0007).
 */
export default async function RenderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const payload = verifyRenderToken(decodeURIComponent(token));
  if (!payload) notFound();

  // A valid signature is not enough: the export must still be the one being
  // worked on, so a token that leaks after the render finishes is inert.
  const claim = await getRenderableExport(payload);
  if (!claim) notFound();

  const resume = await getResumeForUser(payload.userId, payload.resumeId);
  if (!resume) notFound();

  const engine = getTemplateEngine(resume.templateEngineKey);
  if (!engine) notFound();

  const photoUrl = resume.document.personal.photo
    ? `/render/${encodeURIComponent(token)}/foto`
    : null;

  return (
    <main data-render-root>
      <PaperSheet
        engine={engine}
        document={resume.document}
        photoUrl={photoUrl}
      />
    </main>
  );
}
