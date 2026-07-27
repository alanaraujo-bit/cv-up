"use client";

import { Maximize2, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export const ZOOM_MIN = 0.4;
export const ZOOM_MAX = 1.5;
const ZOOM_STEP = 0.1;

export function clampZoom(value: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
}

interface PreviewToolbarProps {
  scale: number;
  /** True while the zoom follows the container width instead of a fixed value. */
  fitted: boolean;
  pageCount: number;
  onZoom: (scale: number) => void;
  onFit: () => void;
  children?: React.ReactNode;
}

export function PreviewToolbar({
  scale,
  fitted,
  pageCount,
  onZoom,
  onFit,
  children,
}: PreviewToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
      {children}

      <span className="flex-1" />

      <span className="text-xs text-muted-foreground" data-tabular>
        {pageCount === 1 ? "1 página" : `${pageCount} páginas`}
      </span>

      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onZoom(clampZoom(scale - ZOOM_STEP))}
          disabled={scale <= ZOOM_MIN}
          aria-label="Diminuir zoom"
        >
          <Minus />
        </Button>

        <span
          className="w-11 text-center text-xs text-muted-foreground"
          data-tabular
          aria-live="polite"
        >
          {Math.round(scale * 100)}%
        </span>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onZoom(clampZoom(scale + ZOOM_STEP))}
          disabled={scale >= ZOOM_MAX}
          aria-label="Aumentar zoom"
        >
          <Plus />
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onFit}
          aria-pressed={fitted}
          aria-label="Ajustar à largura"
        >
          <Maximize2 />
        </Button>
      </div>
    </div>
  );
}
