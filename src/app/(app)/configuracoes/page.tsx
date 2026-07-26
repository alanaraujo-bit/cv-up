import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { getProfile } from "@/features/profile/service";
import { requireUserId } from "@/server/session";

export const metadata: Metadata = {
  title: "Configurações",
};

export default async function SettingsPage() {
  const userId = await requireUserId();
  const profile = await getProfile(userId);

  if (!profile) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seus dados pessoais e preferências da conta.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>
            Essas informações são suas, não dos currículos que você cria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conta</CardTitle>
          <CardDescription>Dados de acesso.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-xs text-muted-foreground">E-mail</p>
          <p data-selectable className="text-sm">
            {profile.email}
          </p>
          <p className="pt-2 text-xs text-muted-foreground">
            A troca de e-mail exige confirmação e chega junto com o envio de
            e-mails transacionais.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
