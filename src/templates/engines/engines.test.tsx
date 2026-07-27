import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  createEmptyDocument,
  createSection,
  type ResumeDocument,
} from "@/features/resume/schemas/document";

import { PaperSheet } from "../paper/paper-sheet";
import { getTemplateEngine, RENDERABLE_ENGINE_KEYS } from "../registry";

/** A résumé that exercises every kind of section a template has to place. */
function fullDocument(): ResumeDocument {
  const document = createEmptyDocument("Maria Aparecida Souza");

  document.personal = {
    ...document.personal,
    headline: "Analista Financeira",
    email: "maria@exemplo.com",
    phone: "(31) 99999-0000",
    city: "Contagem",
    state: "MG",
    linkedin: "https://linkedin.com/in/maria",
    portfolio: "",
    photo: { pathname: "curriculos/1/foto.webp", width: 400, height: 400 },
  };

  document.sections = [
    {
      ...createSection("summary"),
      type: "summary",
      content: "Dez anos em rotinas financeiras.",
    },
    {
      ...createSection("experience"),
      type: "experience",
      items: [
        {
          id: "e1",
          company: "Construtora Horizonte",
          role: "Analista Financeira Sênior",
          city: "Belo Horizonte",
          description: "Fechamento mensal e conciliação bancária.",
          achievements: ["Reduziu a inadimplência em 18%."],
          startDate: "2019-02",
          endDate: "",
          current: true,
        },
      ],
    },
    {
      ...createSection("education"),
      type: "education",
      items: [
        {
          id: "f1",
          institution: "PUC Minas",
          course: "Ciências Contábeis",
          degree: "Bacharelado",
          description: "",
          startDate: "2013-02",
          endDate: "2017-12",
          current: false,
        },
      ],
    },
    {
      ...createSection("skills"),
      type: "skills",
      items: [
        { id: "s1", name: "SAP", category: "technical" },
        { id: "s2", name: "Negociação", category: "soft" },
      ],
    },
    {
      ...createSection("languages"),
      type: "languages",
      items: [{ id: "i1", name: "Inglês", level: "ADVANCED" }],
    },
    {
      ...createSection("certifications"),
      type: "certifications",
      items: [
        {
          id: "c1",
          name: "CPA-20",
          issuer: "Anbima",
          issuedAt: "2021-06",
          credentialUrl: "",
        },
      ],
    },
  ];

  return document;
}

/**
 * Every fact in the document has to survive every layout. This is what makes
 * switching templates lossless: the templates are pure functions of the
 * document, so nothing about the résumé lives in the choice of template.
 */
const FACTS = [
  "Maria Aparecida Souza",
  "Analista Financeira Sênior",
  "Construtora Horizonte",
  "Reduziu a inadimplência em 18%.",
  "Ciências Contábeis",
  "PUC Minas",
  "CPA-20",
];

describe.each(RENDERABLE_ENGINE_KEYS)("template %s", (key) => {
  const engine = getTemplateEngine(key)!;

  it("places every fact from the document on the sheet", () => {
    render(
      <PaperSheet
        engine={engine}
        document={fullDocument()}
        photoUrl="/api/curriculos/1/foto"
      />,
    );

    for (const fact of FACTS) {
      expect(screen.getByText(fact, { exact: false })).toBeInTheDocument();
    }
  });

  it("marks the section headings the user renamed, not the section types", () => {
    const document = fullDocument();
    const experience = document.sections.find(
      (section) => section.type === "experience",
    )!;
    experience.title = "Trajetória";

    render(<PaperSheet engine={engine} document={document} photoUrl={null} />);

    expect(
      screen.getByRole("heading", { name: "Trajetória" }),
    ).toBeInTheDocument();
  });

  it("gives the paginator a block for every entry", () => {
    const { container } = render(
      <PaperSheet engine={engine} document={fullDocument()} photoUrl={null} />,
    );

    // Header, plus at least one per printable section.
    expect(container.querySelectorAll("[data-block]").length).toBeGreaterThan(
      6,
    );
  });

  it("never invents a Portuguese plural", () => {
    // "Comportamental" + "s" reached a real PDF once. Portuguese words ending
    // in -l pluralise to -is, so the labels are written out, never derived.
    render(
      <PaperSheet engine={engine} document={fullDocument()} photoUrl={null} />,
    );

    expect(screen.queryByText(/Comportamentals/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Técnicaas/)).not.toBeInTheDocument();
  });

  it("omits a section the user hid", () => {
    const document = fullDocument();
    const experience = document.sections.find(
      (section) => section.type === "experience",
    )!;
    experience.visible = false;

    render(<PaperSheet engine={engine} document={document} photoUrl={null} />);

    expect(screen.queryByText("Construtora Horizonte")).not.toBeInTheDocument();
  });

  it("prints no headings at all for a résumé nobody has filled in", () => {
    render(
      <PaperSheet
        engine={engine}
        document={createEmptyDocument()}
        photoUrl={null}
      />,
    );

    expect(screen.queryAllByRole("heading", { level: 2 })).toHaveLength(0);
  });

  it("only draws a photo when the template is built for one", () => {
    const { container } = render(
      <PaperSheet
        engine={engine}
        document={fullDocument()}
        photoUrl="/api/curriculos/1/foto"
      />,
    );

    const images = within(container).queryAllByRole("img");
    expect(images).toHaveLength(engine.supportsPhoto ? 1 : 0);
  });
});
