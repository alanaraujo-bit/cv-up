import type { Metadata } from "next";
import { Users } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { db } from "@/server/db";
import { requireUserId } from "@/server/session";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientsPage() {
  const userId = await requireUserId();
  const clients = await db.client.findMany({
    where: { userId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="As pessoas para quem você cria currículos."
      />

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente cadastrado"
          description="O cadastro de clientes, com acompanhamento de status do pedido até a entrega, chega junto com a gestão de clientes."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border">
          {clients.map((client) => (
            <li key={client.id} className="px-4 py-3 text-sm font-medium">
              {client.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
