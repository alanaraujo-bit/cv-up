import { describe, expect, it } from "vitest";

import {
  CURRENT_SCHEMA_VERSION,
  createEmptyDocument,
  createSection,
  parseStoredDocument,
  resumeDocumentSchema,
} from "./document";
import { formatMonthYear, parseMonthYear } from "./primitives";

describe("month/year handling", () => {
  it("round-trips the Brazilian display format", () => {
    expect(parseMonthYear("03/2021")).toBe("2021-03");
    expect(formatMonthYear("2021-03")).toBe("03/2021");
  });

  it("accepts digits without the separator", () => {
    expect(parseMonthYear("032021")).toBe("2021-03");
  });

  it("returns empty for impossible months and short input", () => {
    expect(parseMonthYear("13/2021")).toBe("");
    expect(parseMonthYear("00/2021")).toBe("");
    expect(parseMonthYear("3/21")).toBe("");
  });

  it("sorts correctly as a plain string, which is why it is stored this way", () => {
    expect(["2021-11", "2019-02", "2021-03"].sort()).toEqual([
      "2019-02",
      "2021-03",
      "2021-11",
    ]);
  });
});

describe("createEmptyDocument", () => {
  const doc = createEmptyDocument("Maria Silva");

  it("is valid on creation, so a new resume never starts broken", () => {
    expect(resumeDocumentSchema.safeParse(doc).success).toBe(true);
  });

  it("carries the current schema version", () => {
    expect(doc.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it("gives every section a distinct id", () => {
    const ids = doc.sections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("the storage schema is permissive on purpose", () => {
  // Autosave fires while the user is mid-word; rejecting an incomplete
  // document here would mean losing their work.
  it("accepts a document with nothing filled in", () => {
    expect(resumeDocumentSchema.safeParse(createEmptyDocument()).success).toBe(
      true,
    );
  });

  it("accepts an experience with no dates and no company", () => {
    const doc = createEmptyDocument();
    const experience = doc.sections.find((s) => s.type === "experience")!;
    const result = resumeDocumentSchema.safeParse({
      ...doc,
      sections: doc.sections.map((section) =>
        section.id === experience.id
          ? {
              ...section,
              items: [
                {
                  id: "item-1",
                  company: "",
                  role: "",
                  city: "",
                  description: "",
                  achievements: [],
                  startDate: "",
                  endDate: "",
                  current: false,
                },
              ],
            }
          : section,
      ),
    });

    expect(result.success).toBe(true);
  });
});

describe("resumeDocumentSchema", () => {
  it("rejects duplicated section ids", () => {
    const doc = createEmptyDocument("Maria");
    const first = doc.sections[0]!;
    const result = resumeDocumentSchema.safeParse({
      ...doc,
      sections: [first, { ...doc.sections[1]!, id: first.id }],
    });
    expect(result.success).toBe(false);
  });

  it("normalises a URL typed without its scheme", () => {
    const doc = createEmptyDocument("Maria");
    const parsed = resumeDocumentSchema.parse({
      ...doc,
      personal: { ...doc.personal, linkedin: "linkedin.com/in/maria" },
    });
    expect(parsed.personal.linkedin).toBe("https://linkedin.com/in/maria");
  });

  it("trims whitespace-only input down to empty", () => {
    const doc = createEmptyDocument("Maria");
    const parsed = resumeDocumentSchema.parse({
      ...doc,
      personal: { ...doc.personal, city: "   " },
    });
    expect(parsed.personal.city).toBe("");
  });

  it("reads back a document that round-trips through JSON", () => {
    const doc = createEmptyDocument("Maria");
    doc.sections.push(createSection("projects"));
    const stored: unknown = JSON.parse(JSON.stringify(doc));
    expect(() => parseStoredDocument(stored)).not.toThrow();
  });
});
