"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Pencil, Redo2, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ResumeClientPicker } from "@/features/client/components/resume-client-picker";
import { ExportPdfButton } from "@/features/export/components/export-pdf-button";
import type { TemplateSummary } from "@/features/template/service";
import { cn } from "@/lib/utils";

import type { ResumeEditorData } from "../../service";
import { ResumePreview } from "../../preview/components/resume-preview";
import { summariseAdvisories } from "../../validation/advisories";
import { useEditorStore } from "../store-provider";
import { useAutosave } from "../use-autosave";
import { ResumeEditor } from "./resume-editor";
import { SaveIndicator } from "./save-indicator";

type Pane = "edit" | "preview";

interface EditorWorkspaceProps {
  resume: ResumeEditorData;
  templates: TemplateSummary[];
  /** Clients this résumé may be filed under. Empty hides the picker. */
  clients: { id: string; name: string }[];
  /** False when no PDF renderer is configured — see `server/worker-auth.ts`. */
  pdfExportEnabled: boolean;
}

/**
 * Editor and preview side by side.
 *
 * Below `xl` there is not enough width for both, so the two panes become a
 * toggle rather than a squeeze — a résumé rendered into a 300px column tells
 * the user nothing. Both panes stay mounted either way, so switching back does
 * not re-measure from scratch or lose scroll position.
 */
export function EditorWorkspace({
  resume,
  templates,
  clients,
  pdfExportEnabled,
}: EditorWorkspaceProps) {
  const [pane, setPane] = useState<Pane>("edit");
  const [templateId, setTemplateId] = useState(resume.templateId);

  const document = useEditorStore((state) => state.document);
  const saveState = useEditorStore((state) => state.saveState);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useEditorStore((state) => state.past.length > 0);
  const canRedo = useEditorStore((state) => state.future.length > 0);

  useAutosave(resume.id);

  /*
   * The export gate promised in phase 3: advisories never block saving, but a
   * PDF is what gets handed to a client, and one missing a name or a contact
   * is worse than no PDF. The renderer reads the *saved* document, so pending
   * edits block it too — otherwise the file would quietly be one version old.
   */
  const exportBlockedReason = useMemo(() => {
    const { required } = summariseAdvisories(document);
    if (required > 0) {
      return `Resolva ${required} ${
        required === 1 ? "pendência" : "pendências"
      } antes de gerar o PDF.`;
    }
    if (saveState === "dirty" || saveState === "saving") {
      return "Aguardando salvar as últimas alterações.";
    }
    if (saveState === "error") {
      return "As últimas alterações não foram salvas.";
    }
    return null;
  }, [document, saveState]);

  // ⌘Z / ⌘⇧Z, skipped while the caret is in a field so the browser's own text
  // undo keeps working where the user expects it.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== "z"
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }

      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  return (
    <div data-layout="wide" className="space-y-4">
      <header
        data-print-hide
        className="sticky top-14 z-10 -mx-4 flex flex-wrap items-center gap-2 border-b bg-background/90 px-4 py-2 safe-x backdrop-blur-md"
      >
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/curriculos" aria-label="Voltar para a lista">
            <ArrowLeft />
          </Link>
        </Button>

        <h1 className="min-w-0 flex-1 truncate text-sm font-medium">
          {resume.title}
        </h1>

        <ResumeClientPicker
          resumeId={resume.id}
          clientId={resume.clientId}
          clients={clients}
        />

        <SaveIndicator />

        {pdfExportEnabled ? (
          <ExportPdfButton
            resumeId={resume.id}
            revision={document}
            blockedReason={exportBlockedReason}
          />
        ) : null}

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={undo}
            disabled={!canUndo}
            aria-label="Desfazer"
          >
            <Undo2 />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={redo}
            disabled={!canRedo}
            aria-label="Refazer"
          >
            <Redo2 />
          </Button>
        </div>

        <div className="flex items-center rounded-lg border p-0.5 xl:hidden">
          <Button
            variant={pane === "edit" ? "secondary" : "ghost"}
            size="xs"
            onClick={() => setPane("edit")}
            aria-pressed={pane === "edit"}
          >
            <Pencil data-icon="inline-start" />
            Editar
          </Button>
          <Button
            variant={pane === "preview" ? "secondary" : "ghost"}
            size="xs"
            onClick={() => setPane("preview")}
            aria-pressed={pane === "preview"}
          >
            <Eye data-icon="inline-start" />
            Prévia
          </Button>
        </div>
      </header>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div
          data-print-hide
          className={cn(pane === "preview" && "hidden xl:block")}
        >
          <ResumeEditor resume={resume} />
        </div>

        <ResumePreview
          resumeId={resume.id}
          templates={templates}
          templateId={templateId}
          fallbackTemplateName={resume.templateName}
          onTemplateChange={setTemplateId}
          className={cn(
            "xl:sticky xl:top-28 xl:h-[calc(100dvh-9rem)]",
            pane === "edit" && "hidden xl:flex",
          )}
        />
      </div>
    </div>
  );
}
