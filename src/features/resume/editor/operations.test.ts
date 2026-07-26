import { describe, expect, it } from "vitest";

import {
  createEmptyDocument,
  isItemSection,
  resumeDocumentSchema,
} from "../schemas/document";
import {
  addItem,
  addSection,
  isDocumentEmpty,
  moveInArray,
  moveItem,
  moveSection,
  removeItem,
  removeSection,
  setSectionContent,
  toggleSectionVisibility,
  updateItem,
  updatePersonal,
} from "./operations";

const docWith = (fullName = "Maria") => createEmptyDocument(fullName);
const sectionOfType = (doc: ReturnType<typeof docWith>, type: string) =>
  doc.sections.find((section) => section.type === type)!;

describe("moveInArray", () => {
  it("moves an element and leaves the rest in order", () => {
    expect(moveInArray(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(moveInArray(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });

  it("returns the same reference for a no-op, so React can skip the render", () => {
    const items = ["a", "b"];
    expect(moveInArray(items, 1, 1)).toBe(items);
    expect(moveInArray(items, 0, 9)).toBe(items);
    expect(moveInArray(items, -1, 0)).toBe(items);
  });
});

describe("document operations are immutable", () => {
  it("never mutates the input document", () => {
    const doc = docWith();
    const snapshot = JSON.stringify(doc);

    updatePersonal(doc, { city: "São Paulo" });
    addSection(doc, "projects");
    toggleSectionVisibility(doc, doc.sections[0]!.id);

    expect(JSON.stringify(doc)).toBe(snapshot);
  });
});

describe("sections", () => {
  it("adds and removes a section", () => {
    const doc = docWith();
    const added = addSection(doc, "projects");
    expect(added.sections).toHaveLength(doc.sections.length + 1);

    const removed = removeSection(added, added.sections.at(-1)!.id);
    expect(removed.sections).toHaveLength(doc.sections.length);
  });

  it("toggles visibility without touching other sections", () => {
    const doc = docWith();
    const target = doc.sections[1]!;
    const next = toggleSectionVisibility(doc, target.id);

    expect(next.sections[1]!.visible).toBe(false);
    expect(next.sections[0]).toBe(doc.sections[0]);
  });

  it("reorders sections", () => {
    const doc = docWith();
    const [first, second] = doc.sections;
    const next = moveSection(doc, 0, 1);

    expect(next.sections[0]!.id).toBe(second!.id);
    expect(next.sections[1]!.id).toBe(first!.id);
  });

  it("only writes content onto prose sections", () => {
    const doc = docWith();
    const experience = sectionOfType(doc, "experience");
    const next = setSectionContent(doc, experience.id, "texto");

    expect(next.sections.find((s) => s.id === experience.id)).toEqual(
      experience,
    );
  });
});

describe("items", () => {
  it("adds a blank item of the right shape for the section", () => {
    const doc = docWith();
    const experience = sectionOfType(doc, "experience");
    const next = addItem(doc, experience.id);
    const section = next.sections.find((s) => s.id === experience.id)!;

    expect(isItemSection(section)).toBe(true);
    if (!isItemSection(section)) return;
    expect(section.items).toHaveLength(1);
    expect(section.items[0]).toMatchObject({ company: "", current: false });
  });

  it("updates, reorders and removes items", () => {
    const doc = docWith();
    const skillsId = sectionOfType(doc, "skills").id;

    let next = addItem(addItem(doc, skillsId), skillsId);
    const section = next.sections.find((s) => s.id === skillsId)!;
    if (!isItemSection(section)) throw new Error("expected an item section");
    const [a, b] = section.items;

    next = updateItem(next, skillsId, a!.id, { name: "Excel" });
    next = updateItem(next, skillsId, b!.id, { name: "Power BI" });

    const named = next.sections.find((s) => s.id === skillsId)!;
    if (!isItemSection(named)) throw new Error("expected an item section");
    expect(named.items.map((i) => (i as { name: string }).name)).toEqual([
      "Excel",
      "Power BI",
    ]);

    const moved = moveItem(next, skillsId, 0, 1);
    const movedSection = moved.sections.find((s) => s.id === skillsId)!;
    if (!isItemSection(movedSection)) throw new Error("expected item section");
    expect((movedSection.items[0] as { name: string }).name).toBe("Power BI");

    const removed = removeItem(moved, skillsId, a!.id);
    const finalSection = removed.sections.find((s) => s.id === skillsId)!;
    if (!isItemSection(finalSection)) throw new Error("expected item section");
    expect(finalSection.items).toHaveLength(1);
  });

  it("ignores an item added to a prose section", () => {
    const doc = docWith();
    const summaryId = sectionOfType(doc, "summary").id;
    expect(addItem(doc, summaryId)).toBe(doc);
  });
});

describe("isDocumentEmpty", () => {
  it("is true for a brand new document", () => {
    expect(isDocumentEmpty(createEmptyDocument())).toBe(true);
  });

  it("is false once anything is filled in", () => {
    expect(isDocumentEmpty(createEmptyDocument("Maria"))).toBe(false);

    const doc = createEmptyDocument();
    const summaryId = sectionOfType(doc, "summary").id;
    expect(isDocumentEmpty(setSectionContent(doc, summaryId, "olá"))).toBe(
      false,
    );
  });
});

describe("edited documents stay valid", () => {
  it("survives a realistic editing session", () => {
    let doc = createEmptyDocument("Maria Silva");
    const experienceId = sectionOfType(doc, "experience").id;

    doc = updatePersonal(doc, { city: "Campinas", email: "maria@exemplo.com" });
    doc = addItem(doc, experienceId);

    const section = doc.sections.find((s) => s.id === experienceId)!;
    if (!isItemSection(section)) throw new Error("expected item section");

    doc = updateItem(doc, experienceId, section.items[0]!.id, {
      company: "ACME",
      role: "Analista",
      startDate: "2020-01",
      current: true,
    });
    doc = addSection(doc, "projects");
    doc = moveSection(doc, 0, 2);

    expect(resumeDocumentSchema.safeParse(doc).success).toBe(true);
  });
});
