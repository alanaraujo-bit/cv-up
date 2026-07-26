"use client";

import Link from "next/link";
import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResumeStatus } from "@/generated/prisma/enums";

import { deleteResumeAction } from "../actions";
import type { ResumeListItem } from "../service";

const STATUS_LABEL: Record<ResumeStatus, string> = {
  [ResumeStatus.DRAFT]: "Rascunho",
  [ResumeStatus.IN_PROGRESS]: "Em andamento",
  [ResumeStatus.COMPLETED]: "Concluído",
  [ResumeStatus.ARCHIVED]: "Arquivado",
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function ResumeRow({ resume }: { resume: ResumeListItem }) {
  const [confirming, setConfirming] = useState(false);

  const { execute, isPending } = useAction(deleteResumeAction, {
    onSuccess: () => toast.success("Currículo removido."),
    onError: ({ error }) =>
      toast.error(error.serverError ?? "Não foi possível remover."),
  });

  return (
    <li className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
      <Link
        href={`/curriculos/${resume.id}/editor`}
        className="min-w-0 flex-1 py-1"
      >
        <span className="block truncate text-sm font-medium">
          {resume.title}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {resume.templateName}
          {resume.clientName ? ` · ${resume.clientName}` : ""}
        </span>
      </Link>

      <Badge
        variant={
          resume.status === ResumeStatus.COMPLETED ? "default" : "secondary"
        }
        className="hidden sm:inline-flex"
      >
        {STATUS_LABEL[resume.status]}
      </Badge>

      <time
        dateTime={resume.lastEditedAt.toISOString()}
        className="hidden shrink-0 text-xs text-muted-foreground tabular-nums sm:block"
      >
        {dateFormatter.format(resume.lastEditedAt)}
      </time>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Ações para ${resume.title}`}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={isPending}
            onSelect={(event) => {
              event.preventDefault();
              // Two-step rather than a modal: destructive, but recoverable —
              // the row is soft-deleted, not erased.
              if (!confirming) {
                setConfirming(true);
                return;
              }
              execute({ resumeId: resume.id });
            }}
          >
            <Trash2 />
            {confirming ? "Confirmar remoção" : "Remover"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
