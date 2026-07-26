import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileEdit,
  FileText,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/features/dashboard/components/stat-tile";
import { getDashboardMetrics } from "@/features/dashboard/service";
import { getProfile } from "@/features/profile/service";
import { TemplateCard } from "@/features/template/components/template-card";
import { listTemplates } from "@/features/template/service";
import { requireUserId } from "@/server/session";

export const metadata: Metadata = { title: "Painel" };

export default async function DashboardPage() {
  const userId = await requireUserId();
  const [profile, metrics, templates] = await Promise.all([
    getProfile(userId),
    getDashboardMetrics(userId),
    listTemplates(3),
  ]);

  const firstName = (profile?.displayName ?? profile?.name ?? "").split(" ")[0];

  return (
    <div className="space-y-8">
      <PageHeader
        title={firstName ? `Olá, ${firstName}` : "Painel"}
        description="Um resumo do seu trabalho."
      />

      <section aria-label="Números gerais">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Currículos"
            value={metrics.resumes}
            icon={FileText}
          />
          <StatTile label="Rascunhos" value={metrics.drafts} icon={FileEdit} />
          <StatTile
            label="Concluídos"
            value={metrics.completed}
            icon={CheckCircle2}
          />
          <StatTile label="Clientes" value={metrics.clients} icon={Users} />
        </div>
      </section>

      <section aria-labelledby="templates-title" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="templates-title" className="text-sm font-medium">
            Modelos disponíveis
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/modelos">
              Ver todos
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      </section>
    </div>
  );
}
