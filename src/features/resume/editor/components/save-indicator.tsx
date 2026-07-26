"use client";

import { AlertCircle, Check, Loader2, PenLine } from "lucide-react";

import { useEditorStore } from "../store-provider";

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

export function SaveIndicator() {
  const saveState = useEditorStore((state) => state.saveState);
  const lastSavedAt = useEditorStore((state) => state.lastSavedAt);

  const content = {
    idle: null,
    dirty: (
      <>
        <PenLine className="size-3.5" aria-hidden />
        Alterações não salvas
      </>
    ),
    saving: (
      <>
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        Salvando…
      </>
    ),
    saved: (
      <>
        <Check className="size-3.5 text-success" aria-hidden />
        Salvo{lastSavedAt ? ` às ${timeFormatter.format(lastSavedAt)}` : ""}
      </>
    ),
    error: (
      <>
        <AlertCircle className="size-3.5 text-destructive" aria-hidden />
        Falha ao salvar
      </>
    ),
  }[saveState];

  if (!content) return null;

  return (
    <p
      // Announced politely so a screen reader hears the save land without
      // interrupting whatever the user is typing.
      role="status"
      aria-live="polite"
      className="flex items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground"
    >
      {content}
    </p>
  );
}
