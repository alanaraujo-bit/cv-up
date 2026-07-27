"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { deleteClientAction } from "../actions";

/**
 * Removing a client is confirmed rather than undoable-by-toast: this is another
 * person's contact details, and the résumés made for them stay linked, so the
 * user should be told what removal does before it happens.
 */
export function DeleteClientButton({
  clientId,
  clientName,
  resumeCount,
}: {
  clientId: string;
  clientName: string;
  resumeCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { execute, isPending } = useAction(deleteClientAction, {
    onSuccess: () => {
      toast.success("Cliente removido.");
      router.push("/clientes");
    },
    onError: ({ error }) =>
      toast.error(error.serverError ?? "Não foi possível remover o cliente."),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Trash2 data-icon="inline-start" />
          Remover
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remover {clientName}?</DialogTitle>
          <DialogDescription>
            {resumeCount > 0
              ? `Os ${resumeCount} currículos continuam salvos em Currículos — só deixam de aparecer aqui.`
              : "O cliente sai do quadro. Nada mais é apagado."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 p-5 pt-0">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => execute({ clientId })}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="animate-spin" /> : null}
            Remover
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
