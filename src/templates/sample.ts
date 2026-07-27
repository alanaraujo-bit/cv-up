import {
  createEmptyDocument,
  createSection,
  type ResumeDocument,
} from "@/features/resume/schemas/document";

/**
 * A short, plausible résumé used only to draw catalogue thumbnails. It is
 * deliberately generic — a real client's data must never leave the editor — and
 * long enough that every template shows its structure rather than a title and
 * white space.
 */
export function sampleDocument(): ResumeDocument {
  const document = createEmptyDocument("Maria A. Souza");

  document.personal = {
    ...document.personal,
    headline: "Analista Financeira",
    email: "maria@exemplo.com.br",
    phone: "(31) 99999-0000",
    city: "Belo Horizonte",
    state: "MG",
    linkedin: "https://linkedin.com/in/exemplo",
  };

  document.sections = [
    {
      ...createSection("summary"),
      type: "summary",
      content:
        "Dez anos em rotinas financeiras, com foco em fechamento mensal, conciliação e relacionamento com fornecedores.",
    },
    {
      ...createSection("experience"),
      type: "experience",
      items: [
        {
          id: "sample-exp-1",
          company: "Construtora Horizonte",
          role: "Analista Financeira Sênior",
          city: "Belo Horizonte",
          description:
            "Responsável pelo fechamento mensal e pela conciliação bancária de quatro filiais.",
          achievements: ["Reduziu a inadimplência da carteira em 18%."],
          startDate: "2019-02",
          endDate: "",
          current: true,
        },
        {
          id: "sample-exp-2",
          company: "Rede Bom Preço",
          role: "Assistente Financeira",
          city: "Contagem",
          description: "Contas a pagar e a receber, e apoio ao setor fiscal.",
          achievements: [],
          startDate: "2015-03",
          endDate: "2019-01",
          current: false,
        },
      ],
    },
    {
      ...createSection("education"),
      type: "education",
      items: [
        {
          id: "sample-edu-1",
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
        { id: "sample-skill-1", name: "SAP", category: "technical" },
        { id: "sample-skill-2", name: "Excel avançado", category: "technical" },
        { id: "sample-skill-3", name: "Negociação", category: "soft" },
      ],
    },
    {
      ...createSection("languages"),
      type: "languages",
      items: [
        { id: "sample-lang-1", name: "Inglês", level: "ADVANCED" },
        { id: "sample-lang-2", name: "Espanhol", level: "INTERMEDIATE" },
      ],
    },
  ];

  return document;
}
