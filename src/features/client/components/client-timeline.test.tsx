import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuditAction } from "@/generated/prisma/enums";

import { ClientTimeline } from "./client-timeline";
import type { TimelineEntry } from "../service";

const at = new Date("2026-07-20T14:30:00Z");

function entry(partial: Partial<TimelineEntry>): TimelineEntry {
  return {
    id: "a1",
    action: AuditAction.UPDATE,
    diff: null,
    createdAt: at,
    ...partial,
  };
}

describe("ClientTimeline", () => {
  it("says so plainly when there is no history", () => {
    render(<ClientTimeline entries={[]} />);
    expect(screen.getByText(/Nada aconteceu/)).toBeInTheDocument();
  });

  it("reads a status move in Portuguese, not in enum names", () => {
    render(
      <ClientTimeline
        entries={[
          entry({
            diff: { status: { from: "NEW_REQUEST", to: "IN_PROGRESS" } },
          }),
        ]}
      />,
    );

    expect(
      screen.getByText("Situação: Novo pedido → Em andamento"),
    ).toBeInTheDocument();
  });

  it("never echoes the value back", () => {
    // A timeline records *what* changed. Repeating a phone number on every
    // edit buries the history under data the record already shows.
    render(
      <ClientTimeline
        entries={[
          entry({
            diff: {
              phone: { from: "(31) 90000-0000", to: "(31) 99999-1111" },
            },
          }),
        ]}
      />,
    );

    expect(screen.getByText("Alterou telefone")).toBeInTheDocument();
    expect(screen.queryByText(/99999-1111/)).not.toBeInTheDocument();
  });

  it("distinguishes filling a field in from clearing it", () => {
    render(
      <ClientTimeline
        entries={[
          entry({ id: "a", diff: { city: { from: null, to: "Contagem" } } }),
          entry({ id: "b", diff: { email: { from: "m@e.com", to: null } } }),
        ]}
      />,
    );

    expect(screen.getByText("Preencheu cidade")).toBeInTheDocument();
    expect(screen.getByText("Removeu e-mail")).toBeInTheDocument();
  });

  it("lists every field touched by one save", () => {
    render(
      <ClientTimeline
        entries={[
          entry({
            diff: {
              name: { from: "Maria", to: "Maria A." },
              city: { from: null, to: "Contagem" },
            },
          }),
        ]}
      />,
    );

    expect(screen.getByText("Alterou nome")).toBeInTheDocument();
    expect(screen.getByText("Preencheu cidade")).toBeInTheDocument();
  });

  it("falls back to something readable for an entry it cannot describe", () => {
    render(
      <ClientTimeline
        entries={[
          entry({ id: "x", diff: { status: { from: "NEW_REQUEST" } } }),
          entry({ id: "y", action: AuditAction.CREATE }),
        ]}
      />,
    );

    expect(screen.getByText("Cliente atualizado")).toBeInTheDocument();
    expect(screen.getByText("Cliente cadastrado")).toBeInTheDocument();
  });

  it("carries a machine-readable timestamp for every entry", () => {
    const { container } = render(<ClientTimeline entries={[entry({})]} />);
    expect(container.querySelector("time")).toHaveAttribute(
      "dateTime",
      at.toISOString(),
    );
  });
});
