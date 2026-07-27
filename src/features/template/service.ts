import "server-only";

import type { TemplateCategory } from "@/generated/prisma/enums";
import { db } from "@/server/db";
import { RENDERABLE_ENGINE_KEYS } from "@/templates/registry";

export interface TemplateSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: TemplateCategory;
  engineKey: string;
  accentColor: string | null;
  supportsPhoto: boolean;
  atsSafe: boolean;
  isPremium: boolean;
}

const summarySelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  category: true,
  engineKey: true,
  accentColor: true,
  supportsPhoto: true,
  atsSafe: true,
  isPremium: true,
} as const;

/**
 * The catalogue is global, not per user, and ordered by `sortOrder`.
 *
 * Only templates that have an engine are listed. The remaining four rows stay
 * seeded and inert until phase 8 builds them: offering a model that renders as
 * a blank page would be exactly the dead UI the product rule forbids, and
 * gating on the registry means they appear the day their engine lands, with no
 * migration to remember.
 */
export async function listTemplates(take?: number): Promise<TemplateSummary[]> {
  return db.template.findMany({
    where: { isActive: true, engineKey: { in: RENDERABLE_ENGINE_KEYS } },
    orderBy: { sortOrder: "asc" },
    take,
    select: summarySelect,
  });
}

/**
 * The template a résumé currently uses — listed or not, so the editor can say
 * so. Unscoped `findUnique` is correct here: the catalogue belongs to nobody.
 */
export async function getTemplate(
  templateId: string,
): Promise<TemplateSummary | null> {
  return db.template.findUnique({
    where: { id: templateId },
    select: summarySelect,
  });
}
