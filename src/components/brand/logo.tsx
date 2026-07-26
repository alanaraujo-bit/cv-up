import { cn } from "@/lib/utils";

/**
 * The CV UP mark: an upward arrow rising from a baseline.
 * Renders in `currentColor` so it inherits from its context.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("size-6", className)}
    >
      {/* Geometry mirrors scripts/generate-icons.mjs at 1/16 scale. */}
      <g
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="8.5" y="6.25" width="15" height="19.5" rx="2.5" />
        <path d="M12.25 16.125 16 12.375l3.75 3.75" />
        <path d="M16 12.375v9" />
      </g>
    </svg>
  );
}

/** Mark inside its brand-coloured tile, for headers and avatars. */
export function LogoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground",
        className,
      )}
    >
      <LogoMark className="size-5" />
    </span>
  );
}

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoBadge />
      {showWordmark ? (
        <span className="text-[0.975rem] font-semibold tracking-tight">
          CV&nbsp;UP
        </span>
      ) : null}
    </span>
  );
}
