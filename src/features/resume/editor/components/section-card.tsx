"use client";

import { useState } from "react";
import {
  ChevronDown,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";

import { SortableItem, SortableList } from "@/components/shared/sortable-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  isItemSection,
  SECTION_ITEM_LABEL,
  type ResumeSection,
} from "../../schemas/document";
import type { Advisory } from "../../validation/advisories";
import { ItemFields } from "./item-fields";

interface SectionCardProps {
  section: ResumeSection;
  advisories: Advisory[];
  dragHandle: React.ReactNode;
  onTitleChange: (title: string) => void;
  onToggleVisibility: () => void;
  onRemove: () => void;
  onContentChange: (content: string) => void;
  onAddItem: () => void;
  onUpdateItem: (itemId: string, patch: Record<string, unknown>) => void;
  onRemoveItem: (itemId: string) => void;
  onReorderItems: (from: number, to: number) => void;
}

export function SectionCard({
  section,
  advisories,
  dragHandle,
  onTitleChange,
  onToggleVisibility,
  onRemove,
  onContentChange,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onReorderItems,
}: SectionCardProps) {
  const [open, setOpen] = useState(true);
  const requiredCount = advisories.filter(
    (a) => a.severity === "required",
  ).length;

  return (
    <section
      className={cn(
        "rounded-xl border bg-card",
        !section.visible && "opacity-60",
      )}
      aria-label={section.title}
    >
      <header className="flex items-center gap-1 px-2 py-2">
        {dragHandle}

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex tap-target items-center justify-center rounded-lg px-1 hover:bg-muted"
        >
          <ChevronDown
            className={cn("size-4 transition-transform", !open && "-rotate-90")}
            aria-hidden
          />
          <span className="sr-only">
            {open ? "Recolher seção" : "Expandir seção"}
          </span>
        </button>

        <Input
          value={section.title}
          onChange={(event) => onTitleChange(event.target.value)}
          aria-label="Título da seção"
          className="h-8 flex-1 border-transparent bg-transparent px-2 font-medium shadow-none focus-visible:border-input focus-visible:bg-background"
        />

        {requiredCount > 0 ? (
          <Badge variant="outline" className="shrink-0">
            {requiredCount} {requiredCount === 1 ? "pendência" : "pendências"}
          </Badge>
        ) : null}

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleVisibility}
          aria-label={
            section.visible ? "Ocultar do currículo" : "Mostrar no currículo"
          }
        >
          {section.visible ? <Eye /> : <EyeOff />}
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label="Remover seção"
        >
          <Trash2 />
        </Button>
      </header>

      {open ? (
        <div className="space-y-4 border-t p-4">
          {isItemSection(section) ? (
            <>
              {section.items.length > 0 ? (
                <SortableList
                  ids={section.items.map((item) => item.id)}
                  onReorder={onReorderItems}
                >
                  <ul className="space-y-3">
                    {section.items.map((item, index) => (
                      <SortableItem key={item.id} id={item.id}>
                        {({ setNodeRef, style, isDragging, handle }) => (
                          <li
                            ref={setNodeRef}
                            style={style}
                            className={cn(
                              "rounded-lg border bg-background p-3",
                              isDragging &&
                                "shadow-[var(--shadow-elevation-high)]",
                            )}
                          >
                            <div className="mb-2 flex items-center gap-1">
                              <button
                                type="button"
                                ref={handle.ref}
                                {...handle.attributes}
                                {...handle.listeners}
                                aria-label={`Reordenar ${SECTION_ITEM_LABEL[section.type]} ${index + 1}`}
                                className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
                              >
                                <GripVertical className="size-4" aria-hidden />
                              </button>
                              <span className="flex-1 text-xs text-muted-foreground">
                                {index + 1}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => onRemoveItem(item.id)}
                                aria-label={`Remover ${SECTION_ITEM_LABEL[section.type]} ${index + 1}`}
                              >
                                <Trash2 />
                              </Button>
                            </div>

                            <div className="space-y-3">
                              <ItemFields
                                type={section.type}
                                item={item as Record<string, unknown>}
                                onChange={(patch) =>
                                  onUpdateItem(item.id, patch)
                                }
                              />
                            </div>
                          </li>
                        )}
                      </SortableItem>
                    ))}
                  </ul>
                </SortableList>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum item nesta seção ainda.
                </p>
              )}

              <Button variant="outline" size="sm" onClick={onAddItem}>
                <Plus data-icon="inline-start" />
                Adicionar {SECTION_ITEM_LABEL[section.type]}
              </Button>
            </>
          ) : (
            <Textarea
              value={section.content}
              onChange={(event) => onContentChange(event.target.value)}
              rows={section.type === "objective" ? 2 : 5}
              aria-label={section.title}
              placeholder={
                section.type === "objective"
                  ? "Ex.: Atuar como Analista Financeiro em uma empresa de tecnologia."
                  : "Um parágrafo curto sobre a trajetória, as principais entregas e o que a pessoa busca."
              }
            />
          )}
        </div>
      ) : null}
    </section>
  );
}
