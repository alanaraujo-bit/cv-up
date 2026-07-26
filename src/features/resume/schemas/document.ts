import { z } from "zod";

import {
  certificationItemSchema,
  courseItemSchema,
  customItemSchema,
  educationItemSchema,
  experienceItemSchema,
  languageItemSchema,
  projectItemSchema,
  skillItemSchema,
} from "./items";
import { entityId, newId, storedText, storedUrl } from "./primitives";

/**
 * Bump when the document shape changes in a way stored documents cannot be read
 * with, and add a step to `migrateDocument`.
 */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * This schema is deliberately **permissive**: it describes what may be stored,
 * not what makes a finished resume. Autosave runs while the user is halfway
 * through typing a company name, so "required" here would mean losing work.
 *
 * What a resume still needs before it is presentable is computed separately by
 * `validation/advisories.ts` and surfaced as guidance, never as a save blocker.
 */

export const photoSchema = z.object({
  /**
   * Blob pathname, never a public URL — photos are personal data belonging to
   * third parties and are served through an ownership-checked route.
   */
  pathname: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const personalSchema = z.object({
  fullName: storedText(120),
  headline: storedText(120),
  email: storedText(120),
  phone: storedText(20),
  city: storedText(80),
  state: storedText(40),
  linkedin: storedUrl(),
  portfolio: storedUrl(),
  photo: photoSchema.nullable().catch(null).default(null),
});

const sectionBase = {
  id: entityId,
  /** Overridable heading — "Experiência" may become "Trajetória". */
  title: storedText(60),
  visible: z.boolean().catch(true).default(true),
};

export const sectionSchema = z.discriminatedUnion("type", [
  z.object({
    ...sectionBase,
    type: z.literal("objective"),
    content: storedText(300),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("summary"),
    content: storedText(2000),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("experience"),
    items: z.array(experienceItemSchema).max(30).default([]),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("education"),
    items: z.array(educationItemSchema).max(20).default([]),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("skills"),
    items: z.array(skillItemSchema).max(60).default([]),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("languages"),
    items: z.array(languageItemSchema).max(15).default([]),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("certifications"),
    items: z.array(certificationItemSchema).max(30).default([]),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("projects"),
    items: z.array(projectItemSchema).max(20).default([]),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("courses"),
    items: z.array(courseItemSchema).max(40).default([]),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("custom"),
    items: z.array(customItemSchema).max(20).default([]),
  }),
]);

export const resumeDocumentSchema = z.object({
  schemaVersion: z.number().int().positive(),
  personal: personalSchema,
  sections: z
    .array(sectionSchema)
    .max(20, "Um currículo pode ter até 20 seções.")
    .refine(
      (sections) => new Set(sections.map((s) => s.id)).size === sections.length,
      "Seções duplicadas.",
    ),
});

export type ResumeDocument = z.infer<typeof resumeDocumentSchema>;
export type ResumeSection = z.infer<typeof sectionSchema>;
export type SectionType = ResumeSection["type"];
export type PersonalInfo = z.infer<typeof personalSchema>;
export type ResumePhoto = z.infer<typeof photoSchema>;

/** Sections that hold a list of items rather than a block of prose. */
export type ItemSection = Extract<ResumeSection, { items: unknown[] }>;
export type ProseSection = Extract<ResumeSection, { content: string }>;

export function isItemSection(section: ResumeSection): section is ItemSection {
  return "items" in section;
}

export function isProseSection(
  section: ResumeSection,
): section is ProseSection {
  return "content" in section;
}

export const SECTION_LABEL: Record<SectionType, string> = {
  objective: "Objetivo",
  summary: "Resumo profissional",
  experience: "Experiência",
  education: "Formação",
  skills: "Competências",
  languages: "Idiomas",
  certifications: "Certificações",
  projects: "Projetos",
  courses: "Cursos",
  custom: "Seção personalizada",
};

export const SECTION_ITEM_LABEL: Record<ItemSection["type"], string> = {
  experience: "experiência",
  education: "formação",
  skills: "competência",
  languages: "idioma",
  certifications: "certificação",
  projects: "projeto",
  courses: "curso",
  custom: "item",
};

/** Sections a user may add more than one of. */
export const REPEATABLE_SECTION_TYPES: SectionType[] = ["custom"];

/** The order a new resume starts in — the order most resumes actually want. */
const DEFAULT_SECTION_TYPES: SectionType[] = [
  "objective",
  "summary",
  "experience",
  "education",
  "skills",
  "languages",
];

export function createSection(
  type: SectionType,
  title?: string,
): ResumeSection {
  const base = {
    id: newId(),
    title: title ?? SECTION_LABEL[type],
    visible: true,
  };

  switch (type) {
    case "objective":
    case "summary":
      return { ...base, type, content: "" };
    default:
      return { ...base, type, items: [] };
  }
}

export function createEmptyDocument(fullName = ""): ResumeDocument {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    personal: {
      fullName,
      headline: "",
      email: "",
      phone: "",
      city: "",
      state: "",
      linkedin: "",
      portfolio: "",
      photo: null,
    },
    sections: DEFAULT_SECTION_TYPES.map((type) => createSection(type)),
  };
}

/**
 * Brings a stored document up to the current shape. Runs before validation, so
 * it must tolerate anything previously written.
 */
export function migrateDocument(raw: unknown): unknown {
  return raw;
}

/** Parses a document read from the database, migrating it first. */
export function parseStoredDocument(raw: unknown): ResumeDocument {
  return resumeDocumentSchema.parse(migrateDocument(raw));
}
