import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Mail, MapPin, Pencil, Phone } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientFormDialog } from "@/features/client/components/client-form-dialog";
import { ClientTimeline } from "@/features/client/components/client-timeline";
import { DeleteClientButton } from "@/features/client/components/delete-client-button";
import { CLIENT_STATUS_LABEL } from "@/features/client/schemas/client";
import { getClientForUser, getClientTimeline } from "@/features/client/service";
import { requireUserId } from "@/server/session";

export const metadata: Metadata = { title: "Cliente" };

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await requireUserId();
  const { id } = await params;

  const client = await getClientForUser(userId, id);
  if (!client) notFound();

  const timeline = await getClientTimeline(userId, id);

  const contacts = [
    client.phone ? { icon: Phone, text: client.phone } : null,
    client.email ? { icon: Mail, text: client.email } : null,
    client.city ? { icon: MapPin, text: client.city } : null,
  ].filter((entry) => entry !== null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/clientes" aria-label="Voltar para o quadro">
            <ArrowLeft />
          </Link>
        </Button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold tracking-tight">
            {client.name}
          </h1>
        </div>

        <Badge variant="outline">{CLIENT_STATUS_LABEL[client.status]}</Badge>

        <ClientFormDialog
          clientId={client.id}
          initial={{
            name: client.name,
            email: client.email ?? "",
            phone: client.phone ?? "",
            city: client.city ?? "",
            notes: client.notes ?? "",
            status: client.status,
          }}
          trigger={
            <Button variant="outline" size="sm">
              <Pencil data-icon="inline-start" />
              Editar
            </Button>
          }
        />

        <DeleteClientButton
          clientId={client.id}
          clientName={client.name}
          resumeCount={client.resumes.length}
        />
      </div>

      {contacts.length > 0 ? (
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {contacts.map((contact) => (
            <li key={contact.text} className="flex items-center gap-1.5">
              <contact.icon className="size-4" aria-hidden />
              <span data-selectable>{contact.text}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Currículos</CardTitle>
            </CardHeader>
            <CardContent>
              {client.resumes.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Nenhum currículo ainda"
                  description="Crie um currículo em Currículos e vincule esta pessoa a ele."
                  className="border-0 py-8"
                />
              ) : (
                <ul className="divide-y divide-border">
                  {client.resumes.map((resume) => (
                    <li
                      key={resume.id}
                      className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <Link
                        href={`/curriculos/${resume.id}/editor`}
                        className="min-w-0 flex-1 text-sm font-medium hover:underline"
                      >
                        {resume.title}
                      </Link>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {resume.templateName}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {client.notes ? (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className="text-sm text-pretty whitespace-pre-wrap"
                  data-selectable
                >
                  {client.notes}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientTimeline entries={timeline} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
