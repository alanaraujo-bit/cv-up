"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { ArrowLeft, GripVertical, Redo2, Undo2 } from "lucide-react";

import { SortableItem, SortableList } from "@/components/shared/sortable-list";
import { Button } from "@/components/ui/button";

import type { ResumeEditorData } from "../../service";
import type { PersonalInfo, SectionType } from "../../schemas/document";
import { collectAdvisories } from "../../validation/advisories";
import {
  addItem,
  addSection,
  moveItem,
  moveSection,
  removeItem,
  removeSection,
  setSectionContent,
  setSectionTitle,
  toggleSectionVisibility,
  updateItem,
  updatePersonal,
} from "../operations";
import { useEditorStore } from "../store-provider";
import { useAutosave } from "../use-autosave";
import { AddSectionMenu } from "./add-section-menu";
import { PersonalCard } from "./personal-card";
import { SaveIndicator } from "./save-indicator";
import { SectionCard } from "./section-card";

export function ResumeEditor({ resume }: { resume: ResumeEditorData }) {
  const document = useEditorStore((state) => state.document);
  const edit = useEditorStore((state) => state.edit);
  const commit = useEditorStore((state) => state.commit);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useEditorStore((state) => state.past.length > 0);
  const canRedo = useEditorStore((state) => state.future.length > 0);

  useAutosave(resume.id);

  const advisories = useMemo(() => collectAdvisories(document), [document]);
  const requiredCount = advisories.filter(
    (item) => item.severity === "required",
  ).length;

  // ⌘Z / ⌘⇧Z, skipped while the caret is in a field so the browser's own
  // text undo keeps working where the user expects it.
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

  const handlePersonal = (patch: Partial<PersonalInfo>) =>
    edit(updatePersonal(document, patch));

  const handleAddSection = (type: SectionType) =>
    commit(addSection(document, type));

  return (
    <div className="space-y-4">
      <header className="sticky top-14 z-10 -mx-4 flex flex-wrap items-center gap-2 border-b bg-background/90 px-4 py-2 safe-x backdrop-blur-md">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/curriculos" aria-label="Voltar para a lista">
            <ArrowLeft />
          </Link>
        </Button>

        <h1 className="min-w-0 flex-1 truncate text-sm font-medium">
          {resume.title}
        </h1>

        <SaveIndicator />

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
      </header>

      {requiredCount > 0 ? (
        <p
          className="text-xs text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {requiredCount} {requiredCount === 1 ? "pendência" : "pendências"}{" "}
          para o currículo ficar pronto.
        </p>
      ) : null}

      <PersonalCard
        resumeId={resume.id}
        personal={document.personal}
        onChange={handlePersonal}
      />

      <SortableList
        ids={document.sections.map((section) => section.id)}
        onReorder={(from, to) => commit(moveSection(document, from, to))}
      >
        <div className="space-y-3">
          {document.sections.map((section, index) => (
            <SortableItem key={section.id} id={section.id}>
              {({ setNodeRef, style, isDragging, handle }) => (
                <div
                  ref={setNodeRef}
                  style={style}
                  className={
                    isDragging ? "shadow-[var(--shadow-elevation-high)]" : ""
                  }
                >
                  <SectionCard
                    section={section}
                    advisories={advisories.filter(
                      (item) => item.sectionId === section.id,
                    )}
                    dragHandle={
                      <button
                        type="button"
                        ref={handle.ref}
                        {...handle.attributes}
                        {...handle.listeners}
                        aria-label={`Reordenar seção ${section.title}, posição ${index + 1}`}
                        className="tap-target cursor-grab touch-none rounded px-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
                      >
                        <GripVertical className="size-4" aria-hidden />
                      </button>
                    }
                    onTitleChange={(title) =>
                      edit(setSectionTitle(document, section.id, title))
                    }
                    onToggleVisibility={() =>
                      commit(toggleSectionVisibility(document, section.id))
                    }
                    onRemove={() => commit(removeSection(document, section.id))}
                    onContentChange={(content) =>
                      edit(setSectionContent(document, section.id, content))
                    }
                    onAddItem={() => commit(addItem(document, section.id))}
                    onUpdateItem={(itemId, patch) =>
                      edit(updateItem(document, section.id, itemId, patch))
                    }
                    onRemoveItem={(itemId) =>
                      commit(removeItem(document, section.id, itemId))
                    }
                    onReorderItems={(from, to) =>
                      commit(moveItem(document, section.id, from, to))
                    }
                  />
                </div>
              )}
            </SortableItem>
          ))}
        </div>
      </SortableList>

      <AddSectionMenu
        existingTypes={document.sections.map((section) => section.type)}
        onAdd={handleAddSection}
      />
    </div>
  );
}
