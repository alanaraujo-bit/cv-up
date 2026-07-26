import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { TemplateCard } from "@/features/template/components/template-card";
import { listTemplates } from "@/features/template/service";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Modelos" };

export default async function TemplatesPage() {
  await requireSession();
  const templates = await listTemplates();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modelos"
        description={`${templates.length} modelos disponíveis para montar um currículo.`}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}
