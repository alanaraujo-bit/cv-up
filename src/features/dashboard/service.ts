import "server-only";

import { ResumeStatus } from "@/generated/prisma/enums";
import { db } from "@/server/db";

export interface DashboardMetrics {
  resumes: number;
  drafts: number;
  completed: number;
  clients: number;
  templates: number;
}

/** Every count is scoped to the owner and excludes soft-deleted rows. */
export async function getDashboardMetrics(
  userId: string,
): Promise<DashboardMetrics> {
  const notDeleted = { userId, deletedAt: null };

  const [resumes, drafts, completed, clients, templates] = await Promise.all([
    db.resume.count({ where: notDeleted }),
    db.resume.count({ where: { ...notDeleted, status: ResumeStatus.DRAFT } }),
    db.resume.count({
      where: { ...notDeleted, status: ResumeStatus.COMPLETED },
    }),
    db.client.count({ where: { userId, deletedAt: null } }),
    db.template.count({ where: { isActive: true } }),
  ]);

  return { resumes, drafts, completed, clients, templates };
}
