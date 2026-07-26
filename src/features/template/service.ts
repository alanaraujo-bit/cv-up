import "server-only";

import type { TemplateCategory } from "@/generated/prisma/enums";
import { db } from "@/server/db";

export interface TemplateSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: TemplateCategory;
  accentColor: string | null;
  supportsPhoto: boolean;
  atsSafe: boolean;
  isPremium: boolean;
}

/** The catalogue is global, not per user, and ordered by `sortOrder`. */
export async function listTemplates(take?: number): Promise<TemplateSummary[]> {
  return db.template.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    take,
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      category: true,
      accentColor: true,
      supportsPhoto: true,
      atsSafe: true,
      isPremium: true,
    },
  });
}
