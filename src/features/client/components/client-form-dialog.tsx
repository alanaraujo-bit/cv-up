"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import { Textarea } from "@/components/ui/textarea";
import { ClientStatus } from "@/generated/prisma/enums";

import { createClientAction, updateClientAction } from "../actions";
import { CLIENT_BOARD_STATUSES, CLIENT_STATUS_LABEL } from "../schemas/client";

interface ClientFormValues {
  name: string;
  email: string;
  phone: string;
  city: string;
  notes: string;
  status: ClientStatus;
}

const EMPTY: ClientFormValues = {
  name: "",
  email: "",
  phone: "",
  city: "",
  notes: "",
  status: ClientStatus.NEW_REQUEST,
};

interface ClientFormDialogProps {
  /** Present when editing; absent when creating. */
  clientId?: string;
  initial?: Partial<ClientFormValues>;
  trigger?: React.ReactNode;
}

/**
 * One form for both creating and editing. Only the name is required — when
 * somebody first messages asking for a résumé, their name is genuinely all you
 * know, and a form that refuses to save without an e-mail address just gets
 * filled with a fake one.
 */
export function ClientFormDialog({
  clientId,
  initial,
  trigger,
}: ClientFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<ClientFormValues>({
    ...EMPTY,
    ...initial,
  });

  const editing = typeof clientId === "string";

  const onError = ({ error }: { error: { serverError?: string } }) =>
    toast.error(error.serverError ?? "Não foi possível salvar o cliente.");

  const create = useAction(createClientAction, {
    onSuccess: ({ data }) => {
      if (!data) return;
      setOpen(false);
      setValues(EMPTY);
      toast.success("Cliente cadastrado.");
      router.push(`/clientes/${data.id}`);
    },
    onError,
  });

  const update = useAction(updateClientAction, {
    onSuccess: () => {
      setOpen(false);
      toast.success("Cliente atualizado.");
      router.refresh();
    },
    onError,
  });

  const pending = create.isPending || update.isPending;

  const set = <K extends keyof ClientFormValues>(
    key: K,
    value: ClientFormValues[K],
  ) => setValues((current) => ({ ...current, [key]: value }));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Reopening after a cancelled edit must not show the abandoned draft.
        if (!next && !editing) setValues(EMPTY);
        if (!next && editing) setValues({ ...EMPTY, ...initial });
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus data-icon="inline-start" />
            Novo cliente
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar cliente" : "Novo cliente"}
          </DialogTitle>
          <DialogDescription>
            Só o nome é obrigatório. O resto dá para completar depois.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            const payload = { ...values };
            if (editing) update.execute({ clientId, data: payload });
            else create.execute(payload);
          }}
        >
          <Field label="Nome">
            {(props) => (
              <Input
                {...props}
                value={values.name}
                onChange={(event) => set("name", event.target.value)}
                placeholder="Ex.: Maria Aparecida Souza"
                autoFocus
                required
              />
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="E-mail">
              {(props) => (
                <Input
                  {...props}
                  type="email"
                  value={values.email}
                  onChange={(event) => set("email", event.target.value)}
                  placeholder="maria@exemplo.com"
                />
              )}
            </Field>

            <Field label="Telefone">
              {(props) => (
                <Input
                  {...props}
                  value={values.phone}
                  onChange={(event) => set("phone", event.target.value)}
                  placeholder="(31) 99999-0000"
                />
              )}
            </Field>

            <Field label="Cidade">
              {(props) => (
                <Input
                  {...props}
                  value={values.city}
                  onChange={(event) => set("city", event.target.value)}
                  placeholder="Belo Horizonte"
                />
              )}
            </Field>

            <Field label="Situação">
              {(props) => (
                <SelectNative
                  {...props}
                  value={values.status}
                  onChange={(event) =>
                    set("status", event.target.value as ClientStatus)
                  }
                >
                  {CLIENT_BOARD_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {CLIENT_STATUS_LABEL[status]}
                    </option>
                  ))}
                  {editing ? (
                    <option value={ClientStatus.ARCHIVED}>
                      {CLIENT_STATUS_LABEL.ARCHIVED}
                    </option>
                  ) : null}
                </SelectNative>
              )}
            </Field>
          </div>

          <Field
            label="Observações"
            hint="O que a pessoa pediu, o que ainda falta, combinados."
          >
            {(props) => (
              <Textarea
                {...props}
                value={values.notes}
                onChange={(event) => set("notes", event.target.value)}
                rows={4}
              />
            )}
          </Field>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={pending || values.name.trim() === ""}
            >
              {pending ? <Loader2 className="animate-spin" /> : null}
              {editing ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
