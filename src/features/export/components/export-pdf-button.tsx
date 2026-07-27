"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FileDown, Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { requestExportAction } from "../actions";

/** Slow enough not to hammer the server, fast enough to feel responsive. */
const POLL_MS = 1500;

/** A render that has not finished by now is not going to. */
const GIVE_UP_MS = 90_000;

interface ExportStatusResponse {
  status: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  pageCount: number | null;
  error: string | null;
}

interface ExportPdfButtonProps {
  resumeId: string;
  /**
   * Identity of the document this PDF would be of. When it changes the finished
   * download is withdrawn — handing someone a PDF that no longer matches what
   * is on their screen is worse than making them press the button again.
   */
  revision: unknown;
  /**
   * Why a PDF cannot be made right now — unsaved edits, or a résumé still
   * missing something required. Shown disabled rather than hidden: a button
   * that vanishes leaves the user with no idea what to fix.
   */
  blockedReason?: string | null;
}

/**
 * Requests a PDF and waits for it.
 *
 * Export is asynchronous by construction (ADR 0002) — a real browser has to
 * open the résumé and print it — so this polls rather than blocks.
 */
export function ExportPdfButton({
  resumeId,
  revision,
  blockedReason,
}: ExportPdfButtonProps) {
  const [working, setWorking] = useState(false);
  const [ready, setReady] = useState<{
    exportId: string;
    revision: unknown;
  } | null>(null);

  // Derived rather than reset in an effect: the download simply stops being
  // current the moment the document moves on.
  const download = ready && Object.is(ready.revision, revision) ? ready : null;

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const poll = useCallback(
    (exportId: string, forRevision: unknown, deadline: number) => {
      const tick = async () => {
        if (Date.now() > deadline) {
          setWorking(false);
          toast.error("A geração do PDF demorou demais. Tente de novo.");
          return;
        }

        try {
          const response = await fetch(
            `/api/curriculos/${resumeId}/exportacoes/${exportId}`,
            { cache: "no-store" },
          );
          if (!response.ok) throw new Error("unavailable");

          const data = (await response.json()) as ExportStatusResponse;

          if (data.status === "READY") {
            setWorking(false);
            setReady({ exportId, revision: forRevision });
            toast.success(
              data.pageCount
                ? `PDF pronto — ${data.pageCount} ${
                    data.pageCount === 1 ? "página" : "páginas"
                  }.`
                : "PDF pronto.",
            );
            return;
          }

          if (data.status === "FAILED") {
            setWorking(false);
            toast.error(data.error ?? "Não foi possível gerar o PDF.");
            return;
          }

          timer.current = setTimeout(() => void tick(), POLL_MS);
        } catch {
          setWorking(false);
          toast.error("Não foi possível acompanhar a geração do PDF.");
        }
      };

      timer.current = setTimeout(() => void tick(), POLL_MS);
    },
    [resumeId],
  );

  const { execute, isPending } = useAction(requestExportAction, {
    onSuccess: ({ data }) => {
      if (!data) return;

      if (data.status === "READY") {
        setWorking(false);
        setReady({ exportId: data.exportId, revision });
        return;
      }

      setWorking(true);
      poll(data.exportId, revision, Date.now() + GIVE_UP_MS);
    },
    onError: ({ error }) => {
      setWorking(false);
      toast.error(error.serverError ?? "Não foi possível gerar o PDF.");
    },
  });

  if (download) {
    return (
      <Button asChild variant="outline" size="sm">
        <a
          href={`/api/curriculos/${resumeId}/exportacoes/${download.exportId}/arquivo`}
          download
        >
          <Download data-icon="inline-start" />
          Baixar PDF
        </a>
      </Button>
    );
  }

  if (blockedReason) {
    return (
      <Button variant="outline" size="sm" disabled title={blockedReason}>
        <FileDown data-icon="inline-start" />
        Gerar PDF
      </Button>
    );
  }

  const busy = isPending || working;

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={busy}
      onClick={() => execute({ resumeId })}
    >
      {busy ? (
        <Loader2 className="animate-spin" data-icon="inline-start" />
      ) : (
        <FileDown data-icon="inline-start" />
      )}
      {busy ? "Gerando…" : "Gerar PDF"}
    </Button>
  );
}
