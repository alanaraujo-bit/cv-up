"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { formatMonthYear, parseMonthYear } from "../../schemas/primitives";

/**
 * Presents `MM/AAAA` while storing `YYYY-MM`. Keeps its own draft text so the
 * user can type through an intermediate state like `0` without it being
 * rewritten under the cursor.
 */
export function MonthYearInput({
  value,
  onChange,
  id,
  disabled,
  ...aria
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const [draft, setDraft] = useState(() => formatMonthYear(value));
  const [lastValue, setLastValue] = useState(value);

  // Follow external changes (undo, or clearing when "current" is ticked).
  // Adjusted during render rather than in an effect, which is React's
  // documented pattern for state derived from a prop and avoids the extra
  // render pass an effect would cost on every keystroke.
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(formatMonthYear(value));
  }

  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    const masked =
      digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;

    setDraft(masked);
    onChange(parseMonthYear(masked));
  };

  return (
    <Input
      {...aria}
      id={id}
      value={draft}
      onChange={(event) => handleChange(event.target.value)}
      onBlur={() => setDraft(formatMonthYear(value))}
      disabled={disabled}
      inputMode="numeric"
      autoComplete="off"
      placeholder="MM/AAAA"
      className="tabular-nums"
    />
  );
}
