import type { Metadata } from "next";
import { Users } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  ArchivedClients,
  ClientBoard,
} from "@/features/client/components/client-board";
import { ClientFormDialog } from "@/features/client/components/client-form-dialog";
import {
  listArchivedClients,
  listBoardClients,
} from "@/features/client/service";
import { requireUserId } from "@/server/session";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientsPage() {
  const userId = await requireUserId();
  const [clients, archived] = await Promise.all([
    listBoardClients(userId),
    listArchivedClients(userId),
  ]);

  const hasAny = clients.length > 0 || archived.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Do pedido à entrega, em um quadro só."
        action={<ClientFormDialog />}
      />

      {hasAny ? (
        <>
          <ClientBoard clients={clients} />
          <ArchivedClients clients={archived} />
        </>
      ) : (
        <EmptyState
          icon={Users}
          title="Nenhum cliente cadastrado"
          description="Cadastre a primeira pessoa para quem você vai montar um currículo e acompanhe o pedido até a entrega."
          action={<ClientFormDialog />}
        />
      )}
    </div>
  );
}
