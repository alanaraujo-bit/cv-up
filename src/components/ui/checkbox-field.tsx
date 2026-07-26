"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

/** A native checkbox with a large enough hit area for a thumb. */
export function CheckboxField({
  label,
  checked,
  onCheckedChange,
  className,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}) {
  const id = useId();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className="size-4 rounded accent-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      />
      <label htmlFor={id} className="py-2 text-sm select-none">
        {label}
      </label>
    </div>
  );
}
