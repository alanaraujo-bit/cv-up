"use client";

import { useState, useTransition } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { SelectNative } from "@/components/ui/select-native";

import { setResumeClientAction } from "../actions";

/**
 * Which client a résumé was made for.
 *
 * It lives in the editor rather than on the client screen because that is where
 * the user already is when the question comes up. A résumé with no client is a
 * normal state — this user also makes résumés for people who never became a
 * CRM entry.
 */
export function ResumeClientPicker({
  resumeId,
  clientId,
  clients,
}: {
  resumeId: string;
  clientId: string | null;
  clients: { id: string; name: string }[];
}) {
  const [value, setValue] = useState(clientId ?? "");
  const [, startTransition] = useTransition();
  const { executeAsync } = useAction(setResumeClientAction);

  if (clients.length === 0) return null;

  const change = (next: string) => {
    const previous = value;
    setValue(next);

    startTransition(async () => {
      const result = await executeAsync({ resumeId, clientId: next });
      if (!result?.data) {
        setValue(previous);
        toast.error("Não foi possível vincular o cliente.");
      }
    });
  };

  return (
    <SelectNative
      value={value}
      onChange={(event) => change(event.target.value)}
      aria-label="Cliente deste currículo"
      className="h-7 max-w-44 text-xs"
    >
      <option value="">Sem cliente</option>
      {clients.map((client) => (
        <option key={client.id} value={client.id}>
          {client.name}
        </option>
      ))}
    </SelectNative>
  );
}
