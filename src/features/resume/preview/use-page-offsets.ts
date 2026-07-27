"use client";

import { useCallback, useLayoutEffect, useState } from "react";

import {
  computePageOffsets,
  samePageOffsets,
  type BlockBox,
} from "@/templates/paper/pagination";

interface Options {
  /** The laid-out document inside the first sheet. */
  flowRef: React.RefObject<HTMLDivElement | null>;
  /** The printable area of a sheet — how much fits before a break. */
  windowRef: React.RefObject<HTMLDivElement | null>;
  /** Current zoom, so measurements can be brought back to layout pixels. */
  scale: number;
  /** Anything that changes what is on the page: the document, the template. */
  revision: unknown;
}

/**
 * Measures the rendered document and returns the offset each sheet starts at.
 *
 * Measuring beats predicting: line breaks, hyphenation and font fallback are
 * the browser's business, and the PDF renderer is the same browser. What comes
 * back from the DOM is therefore what will print.
 */
export function usePageOffsets({
  flowRef,
  windowRef,
  scale,
  revision,
}: Options): number[] {
  const [offsets, setOffsets] = useState<number[]>([0]);

  const measure = useCallback(() => {
    const flow = flowRef.current;
    const printable = windowRef.current;
    if (!flow || !printable) return;

    // Zoom is a CSS transform, so the DOM reports scaled numbers; dividing them
    // back out is what keeps a page break in the same place at every zoom.
    const ratio = scale;
    if (!(ratio > 0)) return;

    const flowRect = flow.getBoundingClientRect();
    const pageHeight = printable.getBoundingClientRect().height / ratio;
    const flowHeight = flowRect.height / ratio;

    const blocks: BlockBox[] = Array.from(
      flow.querySelectorAll<HTMLElement>("[data-block]"),
    ).map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        top: (rect.top - flowRect.top) / ratio,
        bottom: (rect.bottom - flowRect.top) / ratio,
      };
    });

    const next = computePageOffsets(blocks, flowHeight, pageHeight);
    // Bailing out on an unchanged result is what stops the ResizeObserver from
    // feeding its own re-render back to itself.
    setOffsets((current) => (samePageOffsets(current, next) ? current : next));
  }, [flowRef, windowRef, scale]);

  useLayoutEffect(() => {
    measure();

    const flow = flowRef.current;
    if (!flow) return;

    const observer = new ResizeObserver(measure);
    observer.observe(flow);

    // Web fonts land after first paint and change every metric on the page.
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [measure, flowRef, revision]);

  return offsets;
}
