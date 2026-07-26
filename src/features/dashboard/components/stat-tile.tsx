import type { LucideIcon } from "lucide-react";

/**
 * Label + value, nothing else. No sparkline until there is history worth
 * plotting; a chart of zeros is decoration, not information.
 *
 * The value uses the font's default proportional figures on purpose —
 * `tabular-nums` widens every digit to a `0` and looks loose at display sizes.
 */
export function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight">
        {value.toLocaleString("pt-BR")}
      </p>
    </div>
  );
}
