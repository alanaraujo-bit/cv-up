import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EditorWorkspace } from "@/features/resume/editor/components/editor-workspace";
import { listClientOptions } from "@/features/client/service";
import { EditorStoreProvider } from "@/features/resume/editor/store-provider";
import { getResumeForUser } from "@/features/resume/service";
import { listTemplates } from "@/features/template/service";
import { requireUserId } from "@/server/session";
import { isPdfExportConfigured } from "@/server/worker-auth";

export const metadata: Metadata = { title: "Editor" };

export default async function ResumeEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await requireUserId();
  const { id } = await params;

  const [resume, templates, clients] = await Promise.all([
    getResumeForUser(userId, id),
    listTemplates(),
    listClientOptions(userId),
  ]);
  if (!resume) notFound();

  return (
    <EditorStoreProvider initialDocument={resume.document}>
      <EditorWorkspace
        resume={resume}
        templates={templates}
        clients={clients}
        pdfExportEnabled={isPdfExportConfigured()}
      />
    </EditorStoreProvider>
  );
}
