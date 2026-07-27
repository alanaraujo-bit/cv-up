import { Camera, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { TemplateThumbnail } from "@/features/template/components/template-thumbnail";
import type { TemplateSummary } from "@/features/template/service";

/**
 * The card leads with the template rendered for real, by the same engine the
 * editor uses — never a screenshot that can go stale.
 */
export function TemplateCard({ template }: { template: TemplateSummary }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: template.accentColor ?? "var(--primary)" }}
        aria-hidden
      />

      <div className="flex justify-center overflow-hidden border-b bg-muted/40 pt-4">
        <TemplateThumbnail
          engineKey={template.engineKey}
          className="elevation-low"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold">{template.name}</h3>
          {template.isPremium ? <Badge variant="outline">Premium</Badge> : null}
        </div>

        <p className="flex-1 text-sm text-pretty text-muted-foreground">
          {template.description}
        </p>

        <ul className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
          {template.atsSafe ? (
            <li className="flex items-center gap-1">
              <ShieldCheck className="size-3.5" aria-hidden />
              Compatível com ATS
            </li>
          ) : null}
          {template.supportsPhoto ? (
            <li className="flex items-center gap-1">
              <Camera className="size-3.5" aria-hidden />
              Aceita foto
            </li>
          ) : null}
        </ul>
      </div>
    </article>
  );
}
