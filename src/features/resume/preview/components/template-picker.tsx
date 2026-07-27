"use client";

import { useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TemplateSummary } from "@/features/template/service";

import { setResumeTemplateAction } from "../../actions";

interface TemplatePickerProps {
  resumeId: string;
  templates: TemplateSummary[];
  templateId: string;
  onChange: (templateId: string) => void;
}

/**
 * Switching templates is instant and lossless: the document carries no
 * template-specific data, so the preview re-renders from state immediately and
 * the server call only records which layout to use next time. A rejected change
 * rolls the selection back rather than leaving the screen disagreeing with the
 * database.
 */
export function TemplatePicker({
  resumeId,
  templates,
  templateId,
  onChange,
}: TemplatePickerProps) {
  const [pending, startTransition] = useTransition();
  const { executeAsync } = useAction(setResumeTemplateAction);

  const current = templates.find((template) => template.id === templateId);

  const select = (next: string) => {
    if (next === templateId) return;

    const previous = templateId;
    onChange(next);

    startTransition(async () => {
      const result = await executeAsync({ resumeId, templateId: next });
      if (!result?.data) {
        onChange(previous);
        toast.error("Não foi possível trocar o modelo.");
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={pending}>
          <span
            aria-hidden
            className="size-2.5 rounded-full"
            style={{
              backgroundColor:
                current?.accentColor ?? "var(--muted-foreground)",
            }}
          />
          {current?.name ?? "Escolher modelo"}
          <ChevronDown data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Modelo do currículo</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={templateId} onValueChange={select}>
          {templates.map((template) => (
            <DropdownMenuRadioItem key={template.id} value={template.id}>
              <span className="flex flex-col gap-0.5">
                <span className="font-medium">{template.name}</span>
                <span className="text-xs text-muted-foreground">
                  {template.description}
                </span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
