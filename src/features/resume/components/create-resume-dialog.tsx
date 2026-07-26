"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { Loader2, Plus } from "lucide-react";
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
import { cn } from "@/lib/utils";

import { createResumeAction } from "../actions";
import type { TemplateSummary } from "@/features/template/service";

export function CreateResumeDialog({
  templates,
}: {
  templates: TemplateSummary[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");

  const { execute, isPending } = useAction(createResumeAction, {
    onSuccess: ({ data }) => {
      if (!data) return;
      setOpen(false);
      router.push(`/curriculos/${data.id}/editor`);
    },
    onError: ({ error }) =>
      toast.error(error.serverError ?? "Não foi possível criar o currículo."),
  });

  const trimmedName = fullName.trim();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" />
          Novo currículo
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo currículo</DialogTitle>
          <DialogDescription>
            Escolha um modelo. Dá para trocar depois sem perder nada.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            execute({
              // The resume is filed under the person it is for.
              title: trimmedName || "Currículo sem título",
              templateId,
              fullName: trimmedName,
            });
          }}
        >
          <Field
            label="Nome da pessoa"
            hint="Usado como nome do currículo e no cabeçalho."
          >
            {(props) => (
              <Input
                {...props}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Ex.: Maria Aparecida Souza"
                autoFocus
              />
            )}
          </Field>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">Modelo</legend>
            <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
              {templates.map((template) => {
                const selected = template.id === templateId;
                return (
                  <label
                    key={template.id}
                    className={cn(
                      "flex cursor-pointer gap-2 rounded-lg border p-3 text-left transition-colors",
                      selected
                        ? "border-primary bg-accent"
                        : "hover:bg-muted/50",
                    )}
                  >
                    <input
                      type="radio"
                      name="template"
                      value={template.id}
                      checked={selected}
                      onChange={() => setTemplateId(template.id)}
                      className="mt-0.5 accent-primary"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">
                        {template.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {template.atsSafe
                          ? "Compatível com ATS"
                          : "Layout com destaque visual"}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !templateId}>
              {isPending ? <Loader2 className="animate-spin" /> : null}
              Criar e editar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
