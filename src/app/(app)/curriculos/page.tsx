import type { Metadata } from "next";
import { FileText } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { db } from "@/server/db";
import { requireUserId } from "@/server/session";

export const metadata: Metadata = { title: "Currículos" };

export default async function ResumesPage() {
  const userId = await requireUserId();
  const resumes = await db.resume.findMany({
    where: { userId, deletedAt: null },
    orderBy: { lastEditedAt: "desc" },
    select: { id: true, title: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Currículos"
        description="Todos os currículos que você criou."
      />

      {resumes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum currículo ainda"
          description="O editor de currículos é a próxima etapa do desenvolvimento. Enquanto isso, dê uma olhada nos modelos disponíveis."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border">
          {resumes.map((resume) => (
            <li key={resume.id} className="px-4 py-3 text-sm font-medium">
              {resume.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
