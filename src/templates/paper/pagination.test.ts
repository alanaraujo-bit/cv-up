import { describe, expect, it } from "vitest";

import {
  computePageOffsets,
  samePageOffsets,
  type BlockBox,
} from "./pagination";

/** Blocks of a uniform height, laid end to end — the common case. */
function stack(count: number, height: number): BlockBox[] {
  return Array.from({ length: count }, (_, index) => ({
    top: index * height,
    bottom: (index + 1) * height,
  }));
}

describe("computePageOffsets", () => {
  it("gives one page when the flow fits", () => {
    expect(computePageOffsets(stack(4, 100), 400, 1000)).toEqual([0]);
  });

  it("counts a flow that exactly fills the page as one page", () => {
    expect(computePageOffsets(stack(10, 100), 1000, 1000)).toEqual([0]);
  });

  it("breaks at the page edge when nothing is in the way", () => {
    // Blocks of 100 tile a 1000px page exactly, so no block straddles.
    expect(computePageOffsets(stack(25, 100), 2500, 1000)).toEqual([
      0, 1000, 2000,
    ]);
  });

  it("pulls a straddling block onto the next page", () => {
    // 0–300, 300–1200, 1200–1500: the middle block covers the 1000px edge, so
    // it moves whole onto sheet two and pushes the last block to sheet three.
    const blocks: BlockBox[] = [
      { top: 0, bottom: 300 },
      { top: 300, bottom: 1200 },
      { top: 1200, bottom: 1500 },
    ];

    expect(computePageOffsets(blocks, 1500, 1000)).toEqual([0, 300, 1200]);
  });

  it("picks the earliest straddling block when several overlap the edge", () => {
    // A two-column layout: both columns cross the page edge, and the break has
    // to clear whichever of them starts higher.
    const blocks: BlockBox[] = [
      { top: 700, bottom: 1100 },
      { top: 400, bottom: 1050 },
      { top: 0, bottom: 400 },
    ];

    expect(computePageOffsets(blocks, 1600, 1000)).toEqual([0, 400, 1400]);
  });

  it("breaks inside a block taller than the sheet rather than looping", () => {
    const blocks: BlockBox[] = [{ top: 0, bottom: 2500 }];
    expect(computePageOffsets(blocks, 2500, 1000)).toEqual([0, 1000, 2000]);
  });

  it("tolerates sub-pixel layout values", () => {
    const blocks: BlockBox[] = [{ top: 0, bottom: 999.9998 }];
    expect(computePageOffsets(blocks, 999.9998, 1000)).toEqual([0]);
  });

  it("paginates even with no blocks reported", () => {
    expect(computePageOffsets([], 2500, 1000)).toEqual([0, 1000, 2000]);
  });

  it("returns a single page for a nonsensical page height", () => {
    expect(computePageOffsets(stack(4, 100), 400, 0)).toEqual([0]);
    expect(computePageOffsets(stack(4, 100), 400, Number.NaN)).toEqual([0]);
  });

  it("stops at the page cap instead of running away", () => {
    expect(computePageOffsets([], 1_000_000, 100)).toHaveLength(40);
  });
});

describe("samePageOffsets", () => {
  it("ignores sub-pixel drift so a resize does not thrash the render", () => {
    expect(samePageOffsets([0, 1000], [0, 1000.2])).toBe(true);
    expect(samePageOffsets([0, 1000], [0, 1002])).toBe(false);
    expect(samePageOffsets([0], [0, 1000])).toBe(false);
  });
});
