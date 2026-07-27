"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Trash2, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ResumePhoto } from "../../schemas/document";
import { useEditorStore } from "../store-provider";

const ERRORS: Record<string, string> = {
  unsupported_type: "Use uma imagem JPG, PNG ou WebP.",
  too_large: "A imagem precisa ter no máximo 5 MB.",
  invalid_image: "Não foi possível ler essa imagem.",
  not_found: "Currículo não encontrado.",
};

export function PhotoField({
  resumeId,
  photo,
  onChange,
}: {
  resumeId: string;
  photo: ResumePhoto | null;
  onChange: (photo: ResumePhoto | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  // Bumped after every change so the browser refetches instead of showing the
  // previous photo from cache. It lives in the store because the live preview
  // renders the same photo and has to refetch at the same moment.
  const version = useEditorStore((state) => state.photoRevision);
  const setVersion = useEditorStore((state) => state.bumpPhotoRevision);

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch(`/api/curriculos/${resumeId}/foto`, {
        method: "POST",
        body,
      });
      const payload: unknown = await response.json();

      if (!response.ok) {
        const code = (payload as { error?: string }).error ?? "";
        toast.error(ERRORS[code] ?? "Não foi possível enviar a foto.");
        return;
      }

      onChange(payload as ResumePhoto);
      setVersion();
    } catch {
      toast.error("Não foi possível enviar a foto.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await fetch(`/api/curriculos/${resumeId}/foto`, { method: "DELETE" });
      onChange(null);
      setVersion();
    } catch {
      toast.error("Não foi possível remover a foto.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted text-muted-foreground">
        {photo ? (
          // Streamed from our own ownership-checked route, never a public URL,
          // so next/image optimisation is deliberately bypassed.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/curriculos/${resumeId}/foto?v=${version}`}
            alt="Foto do currículo"
            className="size-full object-cover"
          />
        ) : (
          <User className="size-7" aria-hidden />
        )}
      </span>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <Loader2 className="animate-spin" /> : <Camera />}
            {photo ? "Trocar foto" : "Adicionar foto"}
          </Button>

          {photo ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={remove}
            >
              <Trash2 />
              Remover
            </Button>
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground">
          JPG, PNG ou WebP, até 5 MB. Alguns modelos não usam foto.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Reset so picking the same file twice still fires a change.
          event.target.value = "";
          if (file) void upload(file);
        }}
      />
    </div>
  );
}
