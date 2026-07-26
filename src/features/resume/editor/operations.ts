import {
  createSection,
  isItemSection,
  type ItemSection,
  type PersonalInfo,
  type ResumeDocument,
  type ResumeSection,
  type SectionType,
} from "../schemas/document";
import { newId } from "../schemas/primitives";

/**
 * Pure transformations over a ResumeDocument. Every one returns a new document
 * so the editor's undo stack can hold plain snapshots.
 */

export function updatePersonal(
  document: ResumeDocument,
  patch: Partial<PersonalInfo>,
): ResumeDocument {
  return { ...document, personal: { ...document.personal, ...patch } };
}

function replaceSection(
  document: ResumeDocument,
  sectionId: string,
  replace: (section: ResumeSection) => ResumeSection,
): ResumeDocument {
  return {
    ...document,
    sections: document.sections.map((section) =>
      section.id === sectionId ? replace(section) : section,
    ),
  };
}

export function setSectionTitle(
  document: ResumeDocument,
  sectionId: string,
  title: string,
): ResumeDocument {
  return replaceSection(document, sectionId, (section) => ({
    ...section,
    title,
  }));
}

export function toggleSectionVisibility(
  document: ResumeDocument,
  sectionId: string,
): ResumeDocument {
  return replaceSection(document, sectionId, (section) => ({
    ...section,
    visible: !section.visible,
  }));
}

export function setSectionContent(
  document: ResumeDocument,
  sectionId: string,
  content: string,
): ResumeDocument {
  return replaceSection(document, sectionId, (section) =>
    section.type === "objective" || section.type === "summary"
      ? { ...section, content }
      : section,
  );
}

export function addSection(
  document: ResumeDocument,
  type: SectionType,
  title?: string,
): ResumeDocument {
  return {
    ...document,
    sections: [...document.sections, createSection(type, title)],
  };
}

export function removeSection(
  document: ResumeDocument,
  sectionId: string,
): ResumeDocument {
  return {
    ...document,
    sections: document.sections.filter((section) => section.id !== sectionId),
  };
}

/** Moves an array element, returning the same array reference when it is a no-op. */
export function moveInArray<T>(items: T[], from: number, to: number): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= items.length ||
    to >= items.length
  ) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved!);
  return next;
}

export function moveSection(
  document: ResumeDocument,
  from: number,
  to: number,
): ResumeDocument {
  const sections = moveInArray(document.sections, from, to);
  return sections === document.sections ? document : { ...document, sections };
}

// --- items -----------------------------------------------------------------

/**
 * Items differ per section type, but every operation here only ever moves,
 * filters or patches them. Working through this shared shape keeps one
 * narrowing cast in `mapItemSection` instead of one per operation.
 */
type AnyItem = { id: string } & Record<string, unknown>;

function mapItemSection(
  document: ResumeDocument,
  sectionId: string,
  map: (items: AnyItem[]) => AnyItem[],
): ResumeDocument {
  return replaceSection(document, sectionId, (section) => {
    if (!isItemSection(section)) return section;
    // Safe: `map` only ever returns items that came from this same section.
    return {
      ...section,
      items: map(section.items as AnyItem[]),
    } as ResumeSection;
  });
}

/** A blank item of the right shape for the section it is going into. */
export function createItem(type: ItemSection["type"]): AnyItem {
  const id = newId();

  switch (type) {
    case "experience":
      return {
        id,
        company: "",
        role: "",
        city: "",
        description: "",
        achievements: [],
        startDate: "",
        endDate: "",
        current: false,
      };
    case "education":
      return {
        id,
        institution: "",
        course: "",
        degree: "",
        description: "",
        startDate: "",
        endDate: "",
        current: false,
      };
    case "skills":
      return { id, name: "", category: "technical" };
    case "languages":
      return { id, name: "", level: "INTERMEDIATE" };
    case "certifications":
      return { id, name: "", issuer: "", issuedAt: "", credentialUrl: "" };
    case "projects":
      return {
        id,
        name: "",
        description: "",
        url: "",
        startDate: "",
        endDate: "",
      };
    case "courses":
      return { id, name: "", institution: "", hours: "", completedAt: "" };
    case "custom":
      return { id, title: "", subtitle: "", description: "" };
  }
}

export function addItem(
  document: ResumeDocument,
  sectionId: string,
): ResumeDocument {
  const section = document.sections.find((s) => s.id === sectionId);
  if (!section || !isItemSection(section)) return document;

  const item = createItem(section.type);
  return mapItemSection(document, sectionId, (items) => [...items, item]);
}

export function updateItem(
  document: ResumeDocument,
  sectionId: string,
  itemId: string,
  patch: Record<string, unknown>,
): ResumeDocument {
  return mapItemSection(document, sectionId, (items) =>
    items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
  );
}

export function removeItem(
  document: ResumeDocument,
  sectionId: string,
  itemId: string,
): ResumeDocument {
  return mapItemSection(document, sectionId, (items) =>
    items.filter((item) => item.id !== itemId),
  );
}

export function moveItem(
  document: ResumeDocument,
  sectionId: string,
  from: number,
  to: number,
): ResumeDocument {
  return mapItemSection(document, sectionId, (items) =>
    moveInArray(items, from, to),
  );
}

/** True when nothing has been filled in beyond the defaults. */
export function isDocumentEmpty(document: ResumeDocument): boolean {
  if (document.personal.fullName.trim().length > 0) return false;
  return document.sections.every((section) =>
    isItemSection(section)
      ? section.items.length === 0
      : section.content.trim().length === 0,
  );
}
