import { describe, expect, it } from "vitest";

import {
  createEmptyDocument,
  createSection,
  isProseSection,
  type ResumeDocument,
} from "@/features/resume/schemas/document";

import {
  contactEntries,
  formatLocation,
  formatPeriod,
  formatUrlLabel,
  isDocumentBlank,
  paragraphs,
  printableSections,
} from "./format";

describe("formatPeriod", () => {
  it("joins both ends of a closed period", () => {
    expect(formatPeriod("2020-03", "2022-08")).toBe("03/2020 – 08/2022");
  });

  it("prints 'atual' for an ongoing role, ignoring any stored end date", () => {
    expect(formatPeriod("2020-03", "2022-08", true)).toBe("03/2020 – atual");
  });

  it("prints the known end alone rather than a dangling dash", () => {
    expect(formatPeriod("2020-03", "")).toBe("03/2020");
    expect(formatPeriod("", "2022-08")).toBe("08/2022");
    expect(formatPeriod("", "")).toBe("");
  });
});

describe("formatLocation", () => {
  it("drops whichever half is missing", () => {
    expect(formatLocation("Belo Horizonte", "MG")).toBe("Belo Horizonte, MG");
    expect(formatLocation("Belo Horizonte", "")).toBe("Belo Horizonte");
    expect(formatLocation("", "MG")).toBe("MG");
    expect(formatLocation("", "")).toBe("");
  });
});

describe("formatUrlLabel", () => {
  it("strips scheme, www and a trailing slash", () => {
    expect(formatUrlLabel("https://www.linkedin.com/in/maria/")).toBe(
      "linkedin.com/in/maria",
    );
    expect(formatUrlLabel("http://maria.dev")).toBe("maria.dev");
  });
});

describe("contactEntries", () => {
  it("keeps résumé order and skips blanks", () => {
    const document = createEmptyDocument("Maria");
    document.personal.email = "maria@exemplo.com";
    document.personal.phone = "(31) 99999-0000";
    document.personal.city = "Contagem";
    document.personal.state = "MG";

    expect(contactEntries(document.personal).map((entry) => entry.key)).toEqual(
      ["phone", "email", "location"],
    );
  });

  it("makes e-mail and phone actionable in the PDF", () => {
    const document = createEmptyDocument("Maria");
    document.personal.email = "maria@exemplo.com";
    document.personal.phone = "31 99999 0000";

    const entries = contactEntries(document.personal);
    expect(entries.find((entry) => entry.key === "email")?.href).toBe(
      "mailto:maria@exemplo.com",
    );
    expect(entries.find((entry) => entry.key === "phone")?.href).toBe(
      "tel:31999990000",
    );
  });
});

describe("paragraphs", () => {
  it("keeps typed line breaks and drops the empty ones", () => {
    expect(paragraphs("Primeira\n\n Segunda \n\n\n")).toEqual([
      "Primeira",
      "Segunda",
    ]);
    expect(paragraphs("   ")).toEqual([]);
  });
});

function documentWith(mutate: (document: ResumeDocument) => void) {
  const document = createEmptyDocument("Maria");
  mutate(document);
  return document;
}

describe("printableSections", () => {
  it("drops sections that are empty, so no heading stands alone", () => {
    const document = createEmptyDocument("Maria");
    expect(printableSections(document)).toEqual([]);
  });

  it("keeps a prose section once it has text", () => {
    const document = documentWith((draft) => {
      const objective = draft.sections.find(isProseSection)!;
      objective.content = "Atuar como analista.";
    });

    expect(printableSections(document)).toHaveLength(1);
  });

  it("drops a hidden section even when it is filled in", () => {
    const document = documentWith((draft) => {
      draft.sections = [
        {
          ...createSection("languages"),
          type: "languages",
          visible: false,
          items: [{ id: "a", name: "Inglês", level: "ADVANCED" }],
        },
      ];
    });

    expect(printableSections(document)).toEqual([]);
  });
});

describe("isDocumentBlank", () => {
  it("is true for a resume nobody has touched", () => {
    expect(isDocumentBlank(createEmptyDocument())).toBe(true);
  });

  it("stops being true as soon as there is a name", () => {
    expect(isDocumentBlank(createEmptyDocument("Maria"))).toBe(false);
  });

  it("stops being true when only a section has content", () => {
    const document = documentWith((draft) => {
      draft.sections = [
        { ...createSection("summary"), type: "summary", content: "Texto." },
      ];
    });

    expect(isDocumentBlank(document)).toBe(false);
  });
});
