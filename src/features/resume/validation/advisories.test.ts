import { describe, expect, it } from "vitest";

import { addItem, updateItem, updatePersonal } from "../editor/operations";
import { createEmptyDocument, isItemSection } from "../schemas/document";
import { collectAdvisories, summariseAdvisories } from "./advisories";

const withExperience = (patch: Record<string, unknown>) => {
  const base = createEmptyDocument("Maria Silva");
  const filled = updatePersonal(base, { email: "maria@exemplo.com" });
  const sectionId = filled.sections.find((s) => s.type === "experience")!.id;
  const added = addItem(filled, sectionId);
  const section = added.sections.find((s) => s.id === sectionId)!;
  if (!isItemSection(section)) throw new Error("expected an item section");
  return {
    document: updateItem(added, sectionId, section.items[0]!.id, patch),
    sectionId,
  };
};

const messages = (document: Parameters<typeof collectAdvisories>[0]) =>
  collectAdvisories(document).map((a) => a.message);

describe("personal details", () => {
  it("asks for a name and a contact on an empty document", () => {
    const found = messages(createEmptyDocument());
    expect(found).toContain("Informe o nome completo.");
    expect(found).toContain("Informe ao menos um contato: e-mail ou telefone.");
  });

  it("accepts a phone alone as contact", () => {
    const doc = updatePersonal(createEmptyDocument("Maria"), {
      phone: "(11) 99999-0000",
    });
    expect(messages(doc)).not.toContain(
      "Informe ao menos um contato: e-mail ou telefone.",
    );
  });

  it("flags a malformed e-mail", () => {
    const doc = updatePersonal(createEmptyDocument("Maria"), {
      email: "maria@",
    });
    expect(messages(doc)).toContain("O e-mail informado é inválido.");
  });
});

describe("experience items", () => {
  it("asks for company, role and dates", () => {
    const { document } = withExperience({});
    const found = messages(document);

    expect(found).toContain("Informe a empresa.");
    expect(found).toContain("Informe o cargo.");
    expect(found).toContain("Informe a data de início.");
    expect(found).toContain("Informe a data de término ou marque como atual.");
  });

  it("stops asking for an end date once marked current", () => {
    const { document } = withExperience({
      company: "ACME",
      role: "Analista",
      startDate: "2020-01",
      current: true,
    });

    expect(messages(document)).not.toContain(
      "Informe a data de término ou marque como atual.",
    );
  });

  it("catches an end date before the start date", () => {
    const { document } = withExperience({
      company: "ACME",
      role: "Analista",
      startDate: "2020-01",
      endDate: "2019-06",
    });

    expect(messages(document)).toContain(
      "O término não pode ser antes do início.",
    );
  });
});

describe("hidden sections", () => {
  it("are not advised on, since they will not be printed", () => {
    const doc = createEmptyDocument("Maria Silva");
    const hidden = {
      ...doc,
      sections: doc.sections.map((section) => ({ ...section, visible: false })),
    };

    const sectionAdvisories = collectAdvisories(hidden).filter(
      (a) => a.sectionId !== null,
    );
    expect(sectionAdvisories).toHaveLength(0);
  });
});

describe("summariseAdvisories", () => {
  it("separates blocking issues from suggestions", () => {
    const summary = summariseAdvisories(createEmptyDocument());
    expect(summary.required).toBeGreaterThan(0);
    expect(summary.suggested).toBeGreaterThan(0);
    expect(summary.isPresentable).toBe(false);
  });

  it("reports presentable once the required items are answered", () => {
    const { document } = withExperience({
      company: "ACME",
      role: "Analista",
      startDate: "2020-01",
      current: true,
    });

    const summary = summariseAdvisories(document);
    expect(summary.required).toBe(0);
    expect(summary.isPresentable).toBe(true);
  });
});
