// @vitest-environment node
// The queue is server-side only, and mocking Prisma keeps this a test of the
// transitions rather than of Postgres.

import { beforeEach, describe, expect, it, vi } from "vitest";

const exportHistory = {
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  updateMany: vi.fn(),
  create: vi.fn(),
};
const resume = { findFirst: vi.fn() };

vi.mock("@/server/db", () => ({ db: { exportHistory, resume } }));

const putPrivateObject = vi.fn();
const deletePrivateObject = vi.fn();
vi.mock("@/server/storage", () => ({
  putPrivateObject: (...args: unknown[]) => putPrivateObject(...args),
  deletePrivateObject: (...args: unknown[]) => deletePrivateObject(...args),
}));

const {
  claimNextExport,
  completeExport,
  failExport,
  requestExport,
  MAX_ATTEMPTS,
  STALE_RENDER_MS,
} = await import("./service");

beforeEach(() => {
  vi.clearAllMocks();
  putPrivateObject.mockResolvedValue({ pathname: "stored/path.pdf" });
});

describe("requestExport", () => {
  it("refuses a résumé that is not the user's", async () => {
    resume.findFirst.mockResolvedValue(null);

    expect(await requestExport("usr_1", "res_1")).toBeNull();
    expect(exportHistory.create).not.toHaveBeenCalled();
  });

  it("returns the export already in flight instead of queueing a second", async () => {
    resume.findFirst.mockResolvedValue({
      id: "res_1",
      template: { slug: "moderno" },
    });
    exportHistory.findFirst.mockResolvedValue({
      id: "exp_existing",
      status: "PROCESSING",
    });

    const result = await requestExport("usr_1", "res_1");

    expect(result).toMatchObject({ id: "exp_existing" });
    expect(exportHistory.create).not.toHaveBeenCalled();
  });

  it("records the template the résumé was exported with", async () => {
    resume.findFirst.mockResolvedValue({
      id: "res_1",
      template: { slug: "executivo" },
    });
    exportHistory.findFirst.mockResolvedValue(null);
    exportHistory.create.mockResolvedValue({ id: "exp_new" });

    await requestExport("usr_1", "res_1");

    expect(exportHistory.create.mock.calls[0]?.[0]).toMatchObject({
      data: expect.objectContaining({ templateSlug: "executivo" }),
    });
  });
});

describe("claimNextExport", () => {
  it("returns null when the queue is empty", async () => {
    exportHistory.findFirst.mockResolvedValue(null);

    expect(await claimNextExport()).toBeNull();
    expect(exportHistory.updateMany).not.toHaveBeenCalled();
  });

  it("also considers renders that stalled, so a killed worker is not fatal", async () => {
    exportHistory.findFirst.mockResolvedValue(null);
    await claimNextExport();

    const where = exportHistory.findFirst.mock.calls[0]?.[0]?.where;
    const stale = where.OR.find(
      (clause: { status: string }) => clause.status === "PROCESSING",
    );

    expect(where.attempts).toEqual({ lt: MAX_ATTEMPTS });
    expect(Date.now() - stale.startedAt.lt.getTime()).toBeGreaterThanOrEqual(
      STALE_RENDER_MS,
    );
  });

  it("claims by attempt count, and takes the oldest job first", async () => {
    exportHistory.findFirst.mockResolvedValue({
      id: "exp_1",
      resumeId: "res_1",
      userId: "usr_1",
      attempts: 1,
    });
    exportHistory.updateMany.mockResolvedValue({ count: 1 });

    const claimed = await claimNextExport();

    expect(claimed).toEqual({
      exportId: "exp_1",
      resumeId: "res_1",
      userId: "usr_1",
      attempt: 2,
    });
    expect(exportHistory.findFirst.mock.calls[0]?.[0]?.orderBy).toEqual({
      requestedAt: "asc",
    });
    expect(exportHistory.updateMany.mock.calls[0]?.[0]).toMatchObject({
      where: { id: "exp_1", attempts: 1 },
      data: expect.objectContaining({ status: "PROCESSING", attempts: 2 }),
    });
  });

  it("yields to the worker that got there first", async () => {
    exportHistory.findFirst.mockResolvedValue({
      id: "exp_1",
      resumeId: "res_1",
      userId: "usr_1",
      attempts: 0,
    });
    // Somebody else moved `attempts` between the read and the write.
    exportHistory.updateMany.mockResolvedValue({ count: 0 });

    expect(await claimNextExport()).toBeNull();
  });
});

describe("completeExport", () => {
  const pdf = Buffer.from("%PDF-1.7 pretend");

  it("stores the file and marks the export ready", async () => {
    exportHistory.findUnique.mockResolvedValue({
      id: "exp_1",
      resumeId: "res_1",
      fileUrl: null,
      status: "PROCESSING",
    });
    exportHistory.updateMany.mockResolvedValue({ count: 1 });

    expect(await completeExport("exp_1", pdf, 2)).toBe(true);
    expect(exportHistory.updateMany.mock.calls[0]?.[0]).toMatchObject({
      where: { id: "exp_1", status: "PROCESSING" },
      data: expect.objectContaining({
        status: "READY",
        fileUrl: "stored/path.pdf",
        pageCount: 2,
        fileSize: pdf.byteLength,
      }),
    });
  });

  it("drops the upload when the job was reclaimed mid-flight", async () => {
    exportHistory.findUnique.mockResolvedValue({
      id: "exp_1",
      resumeId: "res_1",
      fileUrl: null,
      status: "PROCESSING",
    });
    exportHistory.updateMany.mockResolvedValue({ count: 0 });

    expect(await completeExport("exp_1", pdf, 1)).toBe(false);
    expect(deletePrivateObject).toHaveBeenCalledWith("stored/path.pdf");
  });

  it("removes the previous attempt's file rather than orphaning it", async () => {
    exportHistory.findUnique.mockResolvedValue({
      id: "exp_1",
      resumeId: "res_1",
      fileUrl: "old/path.pdf",
      status: "PROCESSING",
    });
    exportHistory.updateMany.mockResolvedValue({ count: 1 });

    await completeExport("exp_1", pdf, 1);

    expect(deletePrivateObject).toHaveBeenCalledWith("old/path.pdf");
  });

  it("refuses a body that is empty or absurdly large", async () => {
    exportHistory.findUnique.mockResolvedValue({ attempts: 1 });
    exportHistory.updateMany.mockResolvedValue({ count: 1 });

    expect(await completeExport("exp_1", Buffer.alloc(0), null)).toBe(false);
    expect(putPrivateObject).not.toHaveBeenCalled();
  });

  it("ignores a result for a job that is no longer being rendered", async () => {
    exportHistory.findUnique.mockResolvedValue({
      id: "exp_1",
      resumeId: "res_1",
      fileUrl: null,
      status: "READY",
    });

    expect(await completeExport("exp_1", pdf, 1)).toBe(false);
    expect(putPrivateObject).not.toHaveBeenCalled();
  });
});

describe("failExport", () => {
  it("requeues while attempts remain — this is the whole retry mechanism", async () => {
    exportHistory.findUnique.mockResolvedValue({ attempts: 1 });
    exportHistory.updateMany.mockResolvedValue({ count: 1 });

    await failExport("exp_1", "Chromium caiu.");

    expect(exportHistory.updateMany.mock.calls[0]?.[0]?.data).toMatchObject({
      status: "PENDING",
      completedAt: null,
      startedAt: null,
    });
  });

  it("gives up once the attempts are spent", async () => {
    exportHistory.findUnique.mockResolvedValue({ attempts: MAX_ATTEMPTS });
    exportHistory.updateMany.mockResolvedValue({ count: 1 });

    await failExport("exp_1", "Chromium caiu de novo.");

    expect(exportHistory.updateMany.mock.calls[0]?.[0]?.data).toMatchObject({
      status: "FAILED",
    });
  });

  it("truncates the message, which the renderer wrote and a user will read", async () => {
    exportHistory.findUnique.mockResolvedValue({ attempts: 0 });
    exportHistory.updateMany.mockResolvedValue({ count: 1 });

    await failExport("exp_1", "x".repeat(1000));

    const { error } = exportHistory.updateMany.mock.calls[0]?.[0]?.data;
    expect(error).toHaveLength(300);
  });
});
