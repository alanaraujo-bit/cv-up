import { cn } from "@/lib/utils";
import { PAGE_HEIGHT_PX, PAGE_WIDTH_PX } from "@/templates/paper/geometry";
import { PaperSheet } from "@/templates/paper/paper-sheet";
import { getTemplateEngine } from "@/templates/registry";
import { sampleDocument } from "@/templates/sample";

/** Wide enough to read the shape of a layout, narrow enough for a card. */
const DEFAULT_WIDTH_PX = 220;

/**
 * The template drawn at card size, from the same engine the editor uses. A
 * screenshot would drift the moment a template changed; this cannot.
 */
export function TemplateThumbnail({
  engineKey,
  width = DEFAULT_WIDTH_PX,
  className,
}: {
  engineKey: string;
  width?: number;
  className?: string;
}) {
  const engine = getTemplateEngine(engineKey);
  if (!engine) return null;

  const scale = width / PAGE_WIDTH_PX;

  return (
    <div
      // Decorative: the card already names and describes the template, and the
      // sample résumé is not information anybody should have read out to them.
      aria-hidden
      className={cn("overflow-hidden bg-white", className)}
      style={{ width, height: PAGE_HEIGHT_PX * scale }}
    >
      <div
        className="origin-top-left"
        style={{ width: PAGE_WIDTH_PX, transform: `scale(${scale})` }}
      >
        <PaperSheet
          engine={engine}
          document={sampleDocument()}
          photoUrl={null}
        />
      </div>
    </div>
  );
}
