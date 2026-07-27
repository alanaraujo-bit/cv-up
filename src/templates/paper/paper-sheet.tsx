import type { ResumeDocument } from "@/features/resume/schemas/document";
import { cn } from "@/lib/utils";

import { themeStyle, type TemplateEngine } from "../types";

export interface PaperSheetProps {
  engine: TemplateEngine;
  document: ResumeDocument;
  photoUrl: string | null;
  /**
   * How far into the flow this sheet starts. Every sheet holds the entire
   * document and shows one slice of it — see `pagination.ts`.
   */
  offset?: number;
  /** The printable area, measured to learn how much fits on a sheet. */
  windowRef?: React.Ref<HTMLDivElement>;
  /** The laid-out document, measured to find the block boundaries. */
  flowRef?: React.Ref<HTMLDivElement>;
  /**
   * Sheets after the first repeat content the first one already carries in the
   * DOM, clipped out of view. Hiding them keeps a screen reader from reading
   * the résumé once per page.
   */
  duplicate?: boolean;
  className?: string;
}

/** One A4 sheet: template chrome, the margins, and a slice of the document. */
export function PaperSheet({
  engine,
  document,
  photoUrl,
  offset = 0,
  windowRef,
  flowRef,
  duplicate = false,
  className,
}: PaperSheetProps) {
  const { Decoration, Flow } = engine;

  return (
    <div
      data-paper
      style={themeStyle(engine.theme)}
      className={cn("paper-page", className)}
      aria-hidden={duplicate || undefined}
    >
      {Decoration ? <Decoration /> : null}

      <div ref={windowRef} className="paper-window">
        <div
          ref={flowRef}
          className="paper-flow"
          style={
            offset === 0 ? undefined : { transform: `translateY(${-offset}px)` }
          }
        >
          <Flow document={document} photoUrl={photoUrl} />
        </div>
      </div>
    </div>
  );
}
