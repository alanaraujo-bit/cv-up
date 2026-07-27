import { ClientStatus, type AuditAction } from "@/generated/prisma/enums";

import { CLIENT_STATUS_LABEL } from "../schemas/client";
import type { TimelineEntry } from "../service";

const FIELD_LABEL: Record<string, string> = {
  name: "nome",
  email: "e-mail",
  phone: "telefone",
  city: "cidade",
  notes: "observações",
  status: "situação",
};

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function isStatus(value: unknown): value is ClientStatus {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(ClientStatus, value)
  );
}

/** `{ from, to }` as the change actually reads in Portuguese. */
function describeChange(field: string, change: unknown): string | null {
  if (typeof change !== "object" || change === null) return null;
  const { from, to } = change as { from?: unknown; to?: unknown };

  if (field === "status") {
    if (!isStatus(to)) return null;
    return isStatus(from)
      ? `Situação: ${CLIENT_STATUS_LABEL[from]} → ${CLIENT_STATUS_LABEL[to]}`
      : `Situação: ${CLIENT_STATUS_LABEL[to]}`;
  }

  const label = FIELD_LABEL[field] ?? field;

  // Values are not echoed back: a timeline is a record of *what* changed, and
  // repeating a phone number or a paragraph of notes on every edit buries it.
  if (to === null || to === "") return `Removeu ${label}`;
  if (from === null || from === "") return `Preencheu ${label}`;
  return `Alterou ${label}`;
}

function describe(entry: TimelineEntry): string[] {
  const { action, diff } = entry;

  if (action === "CREATE") return ["Cliente cadastrado"];
  if (action === "DELETE") return ["Cliente removido"];
  if (action === "RESTORE") return ["Cliente restaurado"];

  if (!diff) return ["Cliente atualizado"];

  const lines = Object.entries(diff)
    .map(([field, change]) => describeChange(field, change))
    .filter((line): line is string => line !== null);

  return lines.length > 0 ? lines : ["Cliente atualizado"];
}

const DOT_COLOUR: Partial<Record<AuditAction, string>> = {
  CREATE: "bg-success",
  DELETE: "bg-destructive",
};

/**
 * The client's history, read straight out of the audit log. Nothing writes to a
 * timeline table — the log is the timeline, so it cannot drift from what
 * actually happened.
 */
export function ClientTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nada aconteceu com este cliente ainda.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {entries.map((entry) => (
        <li key={entry.id} className="flex gap-3">
          <span
            aria-hidden
            className={`mt-1.5 size-2 shrink-0 rounded-full ${
              DOT_COLOUR[entry.action] ?? "bg-border"
            }`}
          />
          <div className="min-w-0 flex-1">
            {describe(entry).map((line, index) => (
              <p key={index} className="text-sm">
                {line}
              </p>
            ))}
            <time
              dateTime={entry.createdAt.toISOString()}
              className="text-xs text-muted-foreground"
            >
              {dateFormat.format(entry.createdAt)}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
