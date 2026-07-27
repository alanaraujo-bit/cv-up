"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { FileText, GripVertical, MapPin } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { SelectNative } from "@/components/ui/select-native";
import type { ClientStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

import { setClientStatusAction } from "../actions";
import {
  CLIENT_BOARD_STATUSES,
  CLIENT_STATUS_LABEL,
  type BoardStatus,
} from "../schemas/client";
import type { ClientCard } from "../service";

/**
 * The request-to-delivery board.
 *
 * Dragging is the fast path on a desktop, but every card also carries a plain
 * `<select>`: on a phone a four-column board cannot all be on screen at once,
 * and a workflow that only works with a mouse is not a workflow.
 */
export function ClientBoard({ clients }: { clients: ClientCard[] }) {
  const [, startTransition] = useTransition();
  const [dragging, setDragging] = useState<ClientCard | null>(null);

  // The card moves the instant it is dropped; the server catches up after.
  const [optimistic, moveOptimistic] = useOptimistic(
    clients,
    (current, move: { id: string; status: ClientStatus }) =>
      current.map((client) =>
        client.id === move.id ? { ...client, status: move.status } : client,
      ),
  );

  const { executeAsync } = useAction(setClientStatusAction);

  const sensors = useSensors(
    // Same threshold as the résumé editor: short enough to feel immediate,
    // long enough that tapping a card to open it is not read as a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const move = (clientId: string, status: ClientStatus) => {
    startTransition(async () => {
      moveOptimistic({ id: clientId, status });
      const result = await executeAsync({ clientId, status });
      if (!result?.data) {
        toast.error("Não foi possível mover o cliente.");
      }
    });
  };

  const onDragStart = (event: DragStartEvent) => {
    setDragging(
      optimistic.find((client) => client.id === String(event.active.id)) ??
        null,
    );
  };

  const onDragEnd = (event: DragEndEvent) => {
    setDragging(null);
    const { active, over } = event;
    if (!over) return;

    const clientId = String(active.id);
    const status = String(over.id) as ClientStatus;
    const current = optimistic.find((client) => client.id === clientId);

    if (!current || current.status === status) return;
    move(clientId, status);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {CLIENT_BOARD_STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            clients={optimistic.filter((client) => client.status === status)}
            onMove={move}
          />
        ))}
      </div>

      <DragOverlay>
        {dragging ? <CardBody client={dragging} floating /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  status,
  clients,
  onMove,
}: {
  status: BoardStatus;
  clients: ClientCard[];
  onMove: (clientId: string, status: ClientStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      aria-label={CLIENT_STATUS_LABEL[status]}
      className={cn(
        "flex min-h-32 flex-col gap-2 rounded-xl border bg-surface/60 p-2 transition-colors",
        isOver && "border-primary bg-accent",
      )}
    >
      <header className="flex items-center justify-between px-1 py-0.5">
        <h2 className="text-xs font-semibold tracking-wide uppercase">
          {CLIENT_STATUS_LABEL[status]}
        </h2>
        <span className="text-xs text-muted-foreground" data-tabular>
          {clients.length}
        </span>
      </header>

      {clients.length === 0 ? (
        <p className="px-1 py-3 text-xs text-muted-foreground">
          Nenhum cliente aqui.
        </p>
      ) : (
        clients.map((client) => (
          <DraggableCard key={client.id} client={client} onMove={onMove} />
        ))
      )}
    </section>
  );
}

function DraggableCard({
  client,
  onMove,
}: {
  client: ClientCard;
  onMove: (clientId: string, status: ClientStatus) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } =
    useDraggable({ id: client.id });

  return (
    <div ref={setNodeRef} className={cn(isDragging && "opacity-40")}>
      <CardBody
        client={client}
        onMove={onMove}
        handle={
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Mover ${client.name}`}
            className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
        }
      />
    </div>
  );
}

function CardBody({
  client,
  handle,
  onMove,
  floating = false,
}: {
  client: ClientCard;
  handle?: React.ReactNode;
  onMove?: (clientId: string, status: ClientStatus) => void;
  floating?: boolean;
}) {
  return (
    <article
      className={cn(
        "rounded-lg border bg-card p-2",
        floating && "shadow-[var(--shadow-elevation-high)]",
      )}
    >
      <div className="flex items-start gap-1">
        {handle}
        <Link
          href={`/clientes/${client.id}`}
          className="min-w-0 flex-1 py-0.5 text-sm font-medium hover:underline"
        >
          {client.name}
        </Link>
      </div>

      <ul className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pl-1 text-xs text-muted-foreground">
        {client.city ? (
          <li className="flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden />
            {client.city}
          </li>
        ) : null}
        <li className="flex items-center gap-1">
          <FileText className="size-3.5" aria-hidden />
          {client.resumeCount}{" "}
          {client.resumeCount === 1 ? "currículo" : "currículos"}
        </li>
      </ul>

      {onMove ? (
        // The wrapper carries the breakpoint, not the <select>: SelectNative
        // draws its chevron as a sibling, so hiding only the control leaves the
        // arrow floating on the card.
        <div className="mt-2 xl:hidden">
          <SelectNative
            value={client.status}
            onChange={(event) =>
              onMove(client.id, event.target.value as ClientStatus)
            }
            aria-label={`Situação de ${client.name}`}
            className="h-8 text-xs"
          >
            {CLIENT_BOARD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {CLIENT_STATUS_LABEL[status]}
              </option>
            ))}
          </SelectNative>
        </div>
      ) : null}
    </article>
  );
}

/** Archived clients, shown as a plain list below the board. */
export function ArchivedClients({ clients }: { clients: ClientCard[] }) {
  if (clients.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Arquivados
      </h2>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border">
        {clients.map((client) => (
          <li key={client.id} className="flex items-center gap-2 px-4 py-2.5">
            <Link
              href={`/clientes/${client.id}`}
              className="flex-1 text-sm hover:underline"
            >
              {client.name}
            </Link>
            <Badge variant="outline">{client.resumeCount}</Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
