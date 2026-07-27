/**
 * Page geometry, in the two units that matter.
 *
 * CSS defines 1in as exactly 96px and 1mm as 1/25.4in, so these conversions are
 * exact rather than an approximation of some display's DPI — which is why the
 * preview can be sized in millimetres and still be measured in pixels.
 * The values here must match the `[data-paper]` tokens in `globals.css`.
 */
export const PX_PER_MM = 96 / 25.4;

export const PAGE_WIDTH_MM = 210;
export const PAGE_HEIGHT_MM = 297;

export const PAGE_WIDTH_PX = PAGE_WIDTH_MM * PX_PER_MM;
export const PAGE_HEIGHT_PX = PAGE_HEIGHT_MM * PX_PER_MM;

/** Space between sheets in the preview, in unscaled px. */
export const SHEET_GAP_PX = 16;

/** Height of a stack of `pages` sheets, before zoom. */
export function stackHeightPx(pages: number): number {
  if (pages <= 0) return 0;
  return pages * PAGE_HEIGHT_PX + (pages - 1) * SHEET_GAP_PX;
}
