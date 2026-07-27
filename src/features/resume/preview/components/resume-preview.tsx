"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { TemplateSummary } from "@/features/template/service";
import { cn } from "@/lib/utils";
import {
  PAGE_WIDTH_PX,
  SHEET_GAP_PX,
  stackHeightPx,
} from "@/templates/paper/geometry";
import { PaperSheet } from "@/templates/paper/paper-sheet";
import { getTemplateEngine } from "@/templates/registry";
import { isDocumentBlank } from "@/templates/format";

import { useEditorStore } from "../../editor/store-provider";
import { usePageOffsets } from "../use-page-offsets";
import { clampZoom, PreviewToolbar } from "./preview-toolbar";
import { TemplatePicker } from "./template-picker";

/** Breathing room around the sheets, subtracted before fitting to the width. */
const GUTTER_PX = 32;

interface ResumePreviewProps {
  resumeId: string;
  /** Only templates with an engine — see `features/template/service.ts`. */
  templates: TemplateSummary[];
  templateId: string;
  /**
   * The name the résumé was created under. Needed because a résumé started
   * before its template had an engine is not in `templates` at all, and the
   * screen still has to say which model it is talking about.
   */
  fallbackTemplateName: string;
  onTemplateChange: (templateId: string) => void;
  className?: string;
}

/**
 * The résumé as it will print: real A4 sheets, real page breaks, redrawn on
 * every keystroke. It renders the same component the PDF route will render in
 * phase 5 (ADR 0002), which is the whole reason the preview can be trusted.
 */
export function ResumePreview({
  resumeId,
  templates,
  templateId,
  fallbackTemplateName,
  onTemplateChange,
  className,
}: ResumePreviewProps) {
  const document = useEditorStore((state) => state.document);

  const template = templates.find((item) => item.id === templateId) ?? null;
  const engine = getTemplateEngine(template?.engineKey);

  const containerRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  // null means "follow the container width"; a number is a zoom the user chose.
  const [zoom, setZoom] = useState<number | null>(null);
  const [fitScale, setFitScale] = useState(0.5);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      const available = container.clientWidth - GUTTER_PX;
      if (available > 0) setFitScale(clampZoom(available / PAGE_WIDTH_PX));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const scale = zoom ?? fitScale;

  // The photo is served from an ownership-checked route under a private cache
  // and always at the same path, so a replacement is only visible under a new
  // URL. The editor bumps this the moment the upload lands.
  const photoVersion = useEditorStore((state) => state.photoRevision);

  const photoUrl =
    document.personal.photo && engine?.supportsPhoto
      ? `/api/curriculos/${resumeId}/foto?v=${photoVersion}`
      : null;

  const revision = useMemo(() => ({ document, engine }), [document, engine]);
  const offsets = usePageOffsets({ flowRef, windowRef, scale, revision });

  if (!engine) {
    return (
      <section
        aria-label="Prévia do currículo"
        className={cn("flex flex-col rounded-xl border bg-card", className)}
      >
        <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
          <TemplatePicker
            resumeId={resumeId}
            templates={templates}
            templateId={templateId}
            onChange={onTemplateChange}
          />
        </div>

        <p className="p-6 text-sm text-balance text-muted-foreground">
          O modelo{" "}
          <strong className="font-medium">
            {template?.name ?? fallbackTemplateName}
          </strong>{" "}
          ainda não tem prévia. Escolha um dos modelos disponíveis acima — nada
          do que você escreveu é perdido na troca.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Prévia do currículo"
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border bg-card",
        className,
      )}
    >
      <PreviewToolbar
        scale={scale}
        fitted={zoom === null}
        pageCount={offsets.length}
        onZoom={setZoom}
        onFit={() => setZoom(null)}
      >
        <TemplatePicker
          resumeId={resumeId}
          templates={templates}
          templateId={templateId}
          onChange={onTemplateChange}
        />
      </PreviewToolbar>

      {isDocumentBlank(document) ? (
        <p className="border-b px-3 py-2 text-xs text-muted-foreground">
          A prévia acompanha o que você digita ao lado.
        </p>
      ) : null}

      <div ref={containerRef} className="flex-1 overflow-auto bg-muted/40 p-4">
        <div
          className="mx-auto"
          style={{
            width: PAGE_WIDTH_PX * scale,
            height: stackHeightPx(offsets.length) * scale,
          }}
        >
          <div
            className="paper-stack flex origin-top-left flex-col"
            style={{
              width: PAGE_WIDTH_PX,
              gap: SHEET_GAP_PX,
              transform: `scale(${scale})`,
            }}
          >
            {offsets.map((offset, index) => (
              <PaperSheet
                key={index}
                engine={engine}
                document={document}
                photoUrl={photoUrl}
                offset={offset}
                duplicate={index > 0}
                windowRef={index === 0 ? windowRef : undefined}
                flowRef={index === 0 ? flowRef : undefined}
                className="shrink-0 elevation-medium"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
