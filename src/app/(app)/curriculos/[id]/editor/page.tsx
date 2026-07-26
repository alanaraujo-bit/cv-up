import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ResumeEditor } from "@/features/resume/editor/components/resume-editor";
import { EditorStoreProvider } from "@/features/resume/editor/store-provider";
import { getResumeForUser } from "@/features/resume/service";
import { requireUserId } from "@/server/session";

export const metadata: Metadata = { title: "Editor" };

export default async function ResumeEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await requireUserId();
  const { id } = await params;

  const resume = await getResumeForUser(userId, id);
  if (!resume) notFound();

  return (
    <EditorStoreProvider initialDocument={resume.document}>
      <ResumeEditor resume={resume} />
    </EditorStoreProvider>
  );
}
