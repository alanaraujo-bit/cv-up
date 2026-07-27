"use client";

import { useMemo } from "react";
import { GripVertical } from "lucide-react";

import { SortableItem, SortableList } from "@/components/shared/sortable-list";

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
import { AddSectionMenu } from "./add-section-menu";
import { PersonalCard } from "./personal-card";
import { SectionCard } from "./section-card";

/**
 * The form half of the workspace. Autosave, undo/redo and the document title
 * live in `EditorWorkspace`, which owns both panes.
 */
export function ResumeEditor({ resume }: { resume: ResumeEditorData }) {
  const document = useEditorStore((state) => state.document);
  const edit = useEditorStore((state) => state.edit);
  const commit = useEditorStore((state) => state.commit);

  const advisories = useMemo(() => collectAdvisories(document), [document]);
  const requiredCount = advisories.filter(
    (item) => item.severity === "required",
  ).length;

  const handlePersonal = (patch: Partial<PersonalInfo>) =>
    edit(updatePersonal(document, patch));

  const handleAddSection = (type: SectionType) =>
    commit(addSection(document, type));

  return (
    <div className="space-y-4">
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
