import "server-only";

import { ExportFormat, ExportStatus } from "@/generated/prisma/enums";
import { db } from "@/server/db";
import { deletePrivateObject, putPrivateObject } from "@/server/storage";

/**
 * The export queue.
 *
 * `ExportHistory` *is* the queue — see ADR 0008. Every transition below is a
 * conditional `updateMany` rather than a read followed by a write, so two
 * renderers polling at the same moment cannot both claim the same row: the
 * second one updates zero rows and moves on.
 */

/** A render that has not reported back within this is presumed dead. */
export const STALE_RENDER_MS = 2 * 60 * 1000;

/** Enough to ride out a redeploy or a flaky cold start, not enough to loop. */
export const MAX_ATTEMPTS = 3;

/**
 * A résumé PDF is a few hundred kilobytes. Anything near this is a renderer
 * malfunction, and it arrives over the network, so it is bounded.
 */
const MAX_PDF_BYTES = 20 * 1024 * 1024;

export interface ExportSummary {
  id: string;
  status: ExportStatus;
  pageCount: number | null;
  fileSize: number | null;
  error: string | null;
  requestedAt: Date;
  completedAt: Date | null;
}

const summarySelect = {
  id: true,
  status: true,
  pageCount: true,
  fileSize: true,
  error: true,
  requestedAt: true,
  completedAt: true,
} as const;

/**
 * Queues a PDF for a résumé the user owns. Returns null when the résumé is not
 * theirs — indistinguishable, on purpose, from one that does not exist.
 */
export async function requestExport(
  userId: string,
  resumeId: string,
): Promise<ExportSummary | null> {
  const resume = await db.resume.findFirst({
    where: { id: resumeId, userId, deletedAt: null },
    select: { id: true, template: { select: { slug: true } } },
  });
  if (!resume) return null;

  // An export already in flight is returned as-is. Queueing a second render of
  // an unchanged résumé just makes the user wait behind their own request.
  const inFlight = await db.exportHistory.findFirst({
    where: {
      resumeId,
      userId,
      status: { in: [ExportStatus.PENDING, ExportStatus.PROCESSING] },
    },
    orderBy: { requestedAt: "desc" },
    select: summarySelect,
  });
  if (inFlight) return inFlight;

  return db.exportHistory.create({
    data: {
      userId,
      resumeId,
      format: ExportFormat.PDF,
      status: ExportStatus.PENDING,
      templateSlug: resume.template.slug,
    },
    select: summarySelect,
  });
}

/** One export, scoped to its owner. */
export async function getExport(
  userId: string,
  exportId: string,
): Promise<ExportSummary | null> {
  return db.exportHistory.findFirst({
    where: { id: exportId, userId },
    select: summarySelect,
  });
}

/** The stored object for a finished export, scoped to its owner. */
export async function getExportFile(
  userId: string,
  exportId: string,
): Promise<{ pathname: string; resumeTitle: string } | null> {
  const row = await db.exportHistory.findFirst({
    where: { id: exportId, userId, status: ExportStatus.READY },
    select: { fileUrl: true, resume: { select: { title: true } } },
  });

  if (!row?.fileUrl) return null;
  return { pathname: row.fileUrl, resumeTitle: row.resume.title };
}

/*
 * The three functions below run on behalf of the renderer, not a user, so they
 * take an export id without a `userId` alongside it. That is the one place in
 * the codebase where an unscoped query on user data is correct: the id came
 * from `claimNextExport`, which is the authority, and the routes that expose
 * them authenticate the worker rather than a session.
 */

export interface ClaimedExport {
  exportId: string;
  resumeId: string;
  userId: string;
  attempt: number;
}

/**
 * Takes the oldest renderable job, if there is one.
 *
 * Rows stuck in PROCESSING past `STALE_RENDER_MS` are fair game again: a worker
 * that was killed mid-render never gets to report a failure, and without this
 * the user would wait forever on a job nobody owns.
 */
export async function claimNextExport(): Promise<ClaimedExport | null> {
  const staleBefore = new Date(Date.now() - STALE_RENDER_MS);

  const candidate = await db.exportHistory.findFirst({
    where: {
      attempts: { lt: MAX_ATTEMPTS },
      OR: [
        { status: ExportStatus.PENDING },
        {
          status: ExportStatus.PROCESSING,
          startedAt: { lt: staleBefore },
        },
      ],
    },
    orderBy: { requestedAt: "asc" },
    select: { id: true, resumeId: true, userId: true, attempts: true },
  });

  if (!candidate) return null;

  // The claim itself. `attempts` in the filter is what makes this atomic:
  // whoever writes first moves the counter, and the loser matches nothing.
  const { count } = await db.exportHistory.updateMany({
    where: { id: candidate.id, attempts: candidate.attempts },
    data: {
      status: ExportStatus.PROCESSING,
      startedAt: new Date(),
      attempts: candidate.attempts + 1,
      error: null,
    },
  });

  if (count === 0) return null;

  return {
    exportId: candidate.id,
    resumeId: candidate.resumeId,
    userId: candidate.userId,
    attempt: candidate.attempts + 1,
  };
}

/** Stores the rendered PDF and marks the export ready. */
export async function completeExport(
  exportId: string,
  pdf: Buffer,
  pageCount: number | null,
): Promise<boolean> {
  if (pdf.byteLength === 0 || pdf.byteLength > MAX_PDF_BYTES) {
    await failExport(exportId, "PDF fora do tamanho aceitável.");
    return false;
  }

  const row = await db.exportHistory.findUnique({
    where: { id: exportId },
    select: { id: true, resumeId: true, fileUrl: true, status: true },
  });
  if (!row || row.status !== ExportStatus.PROCESSING) return false;

  const stored = await putPrivateObject(
    `curriculos/${row.resumeId}/exportacoes/${exportId}.pdf`,
    pdf,
    "application/pdf",
  );

  const { count } = await db.exportHistory.updateMany({
    // Still PROCESSING: a job reclaimed as stale while this upload was in
    // flight belongs to the other worker now, and this result is discarded.
    where: { id: exportId, status: ExportStatus.PROCESSING },
    data: {
      status: ExportStatus.READY,
      fileUrl: stored.pathname,
      fileSize: pdf.byteLength,
      pageCount,
      completedAt: new Date(),
      error: null,
    },
  });

  if (count === 0) {
    await deletePrivateObject(stored.pathname);
    return false;
  }

  // A retry leaves the earlier attempt's file orphaned in the store.
  if (row.fileUrl && row.fileUrl !== stored.pathname) {
    await deletePrivateObject(row.fileUrl);
  }

  return true;
}

/**
 * Records a failed attempt. The row goes back to PENDING while attempts remain,
 * which is the whole retry mechanism — the next poll picks it up again.
 */
export async function failExport(
  exportId: string,
  message: string,
): Promise<void> {
  const row = await db.exportHistory.findUnique({
    where: { id: exportId },
    select: { attempts: true },
  });
  if (!row) return;

  const exhausted = row.attempts >= MAX_ATTEMPTS;

  await db.exportHistory.updateMany({
    where: { id: exportId, status: ExportStatus.PROCESSING },
    data: {
      status: exhausted ? ExportStatus.FAILED : ExportStatus.PENDING,
      // Truncated: this string is written by the renderer and shown to a user.
      error: message.slice(0, 300),
      startedAt: null,
      completedAt: exhausted ? new Date() : null,
    },
  });
}
