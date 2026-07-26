import type { Metadata } from "next";
import { FileText } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { CreateResumeDialog } from "@/features/resume/components/create-resume-dialog";
import { ResumeRow } from "@/features/resume/components/resume-row";
import { listResumes } from "@/features/resume/service";
import { listTemplates } from "@/features/template/service";
import { requireUserId } from "@/server/session";

export const metadata: Metadata = { title: "Currículos" };

export default async function ResumesPage() {
  const userId = await requireUserId();
  const [resumes, templates] = await Promise.all([
    listResumes(userId),
    listTemplates(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Currículos"
        description="Todos os currículos que você criou."
        action={<CreateResumeDialog templates={templates} />}
      />

      {resumes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum currículo ainda"
          description="Crie o primeiro currículo escolhendo um modelo. Tudo é salvo automaticamente enquanto você escreve."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border">
          {resumes.map((resume) => (
            <ResumeRow key={resume.id} resume={resume} />
          ))}
        </ul>
      )}
    </div>
  );
}
