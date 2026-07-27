/**
 * Where the sheets break.
 *
 * The whole document is laid out once, as a single continuous flow; each sheet
 * then shows one slice of it. Deciding where those slices start is therefore a
 * matter of picking offsets, and the only rule is the one print already
 * enforces through `break-inside: avoid`: **a break may not land inside a
 * block.** Preview and PDF agree because both honour the same [data-block]
 * boundaries — see `globals.css`.
 */

export interface BlockBox {
  /** Distance from the top of the flow to the top of the block, in CSS px. */
  top: number;
  bottom: number;
}

/**
 * Sub-pixel slack. Browsers report fractional layout values, so a block ending
 * at 841.9999 must count as ending exactly where the page does.
 */
const EPSILON = 0.5;

/**
 * A résumé that somehow never advances must not lock up the tab. Well past any
 * plausible document — a 40-page résumé is a different problem.
 */
const MAX_PAGES = 40;

/**
 * Offsets, in flow coordinates, at which each sheet begins. Always starts with
 * `0`, so `offsets.length` is the page count.
 */
export function computePageOffsets(
  blocks: readonly BlockBox[],
  flowHeight: number,
  pageHeight: number,
): number[] {
  if (!Number.isFinite(pageHeight) || pageHeight <= 0) return [0];

  const offsets = [0];
  let current = 0;

  while (offsets.length < MAX_PAGES) {
    const limit = current + pageHeight;
    if (flowHeight <= limit + EPSILON) break;

    // The first block the page bottom would cut through. Pulling it forward
    // whole is exactly what `break-inside: avoid` does when printing.
    let next = limit;
    for (const block of blocks) {
      if (block.top < limit - EPSILON && block.bottom > limit + EPSILON) {
        if (block.top < next) next = block.top;
      }
    }

    // A block taller than a whole sheet cannot be kept intact; break at the
    // page edge rather than looping on the same offset forever. Chromium makes
    // the same concession.
    if (next <= current + EPSILON) next = limit;

    offsets.push(next);
    current = next;
  }

  return offsets;
}

/** True when two offset lists describe the same pagination. */
export function samePageOffsets(a: readonly number[], b: readonly number[]) {
  return (
    a.length === b.length &&
    a.every((offset, index) => Math.abs(offset - (b[index] ?? 0)) < EPSILON)
  );
}
