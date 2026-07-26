import { z } from "zod";

import { entityId, storedMonthYear, storedText, storedUrl } from "./primitives";

/** A period that may still be running. `startDate`/`endDate` may be empty. */
const period = {
  startDate: storedMonthYear,
  endDate: storedMonthYear,
  current: z.boolean().catch(false).default(false),
};

export const experienceItemSchema = z.object({
  id: entityId,
  company: storedText(120),
  role: storedText(120),
  city: storedText(80),
  description: storedText(2000),
  achievements: z
    .array(z.string().trim().max(300))
    .max(10)
    .catch([])
    .default([]),
  ...period,
});

export const educationItemSchema = z.object({
  id: entityId,
  institution: storedText(120),
  course: storedText(120),
  degree: storedText(60),
  description: storedText(1000),
  ...period,
});

export const SKILL_CATEGORIES = ["technical", "soft"] as const;
export const skillItemSchema = z.object({
  id: entityId,
  name: storedText(60),
  category: z.enum(SKILL_CATEGORIES).catch("technical").default("technical"),
});

export const LANGUAGE_LEVELS = [
  "BASIC",
  "INTERMEDIATE",
  "ADVANCED",
  "FLUENT",
  "NATIVE",
] as const;
export const languageItemSchema = z.object({
  id: entityId,
  name: storedText(60),
  level: z.enum(LANGUAGE_LEVELS).catch("INTERMEDIATE").default("INTERMEDIATE"),
});

export const certificationItemSchema = z.object({
  id: entityId,
  name: storedText(150),
  issuer: storedText(120),
  issuedAt: storedMonthYear,
  credentialUrl: storedUrl(),
});

export const projectItemSchema = z.object({
  id: entityId,
  name: storedText(120),
  description: storedText(1000),
  url: storedUrl(),
  startDate: storedMonthYear,
  endDate: storedMonthYear,
});

export const courseItemSchema = z.object({
  id: entityId,
  name: storedText(150),
  institution: storedText(120),
  hours: storedText(6),
  completedAt: storedMonthYear,
});

export const customItemSchema = z.object({
  id: entityId,
  title: storedText(150),
  subtitle: storedText(150),
  description: storedText(1000),
});

export type ExperienceItem = z.infer<typeof experienceItemSchema>;
export type EducationItem = z.infer<typeof educationItemSchema>;
export type SkillItem = z.infer<typeof skillItemSchema>;
export type LanguageItem = z.infer<typeof languageItemSchema>;
export type CertificationItem = z.infer<typeof certificationItemSchema>;
export type ProjectItem = z.infer<typeof projectItemSchema>;
export type CourseItem = z.infer<typeof courseItemSchema>;
export type CustomItem = z.infer<typeof customItemSchema>;

export const LANGUAGE_LEVEL_LABEL: Record<
  (typeof LANGUAGE_LEVELS)[number],
  string
> = {
  BASIC: "Básico",
  INTERMEDIATE: "Intermediário",
  ADVANCED: "Avançado",
  FLUENT: "Fluente",
  NATIVE: "Nativo",
};

export const SKILL_CATEGORY_LABEL: Record<
  (typeof SKILL_CATEGORIES)[number],
  string
> = {
  technical: "Técnica",
  soft: "Comportamental",
};
