import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProfile } from "@/features/profile/service";
import { db } from "@/server/db";
import { requireUserId } from "@/server/session";

export const metadata: Metadata = {
  title: "Painel",
};

/**
 * Phase 1 lands here after sign-in. The real dashboard — counters, recent
 * resumes, quick actions — is phase 2; nothing is rendered here that is not
 * backed by real data.
 */
export default async function DashboardPage() {
  const userId = await requireUserId();
  const [profile, templateCount] = await Promise.all([
    getProfile(userId),
    db.template.count({ where: { isActive: true } }),
  ]);

  const greetingName = (profile?.displayName ?? profile?.name ?? "").split(
    " ",
  )[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greetingName ? `Olá, ${greetingName}` : "Olá"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sua conta está pronta. O painel completo chega na próxima etapa.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modelos disponíveis</CardTitle>
          <CardDescription>
            Catálogo já carregado no banco de dados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tabular-nums">{templateCount}</p>
        </CardContent>
      </Card>
    </div>
  );
}
