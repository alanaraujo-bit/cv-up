import {
  isItemSection,
  isProseSection,
  type ResumeDocument,
} from "../schemas/document";
import { isValidEmail, isValidUrl } from "../schemas/primitives";

export type AdvisorySeverity = "required" | "suggested";

export interface Advisory {
  severity: AdvisorySeverity;
  message: string;
  /** Where to send the user; the section id, or null for personal details. */
  sectionId: string | null;
  itemId?: string;
}

/**
 * What the resume still needs. These are **advisory**: they never block saving
 * — the user is allowed to leave work half-finished — but they drive the
 * "pendências" counter and, from phase 5, the export gate.
 */
export function collectAdvisories(document: ResumeDocument): Advisory[] {
  const advisories: Advisory[] = [];
  const { personal } = document;

  if (personal.fullName.trim().length === 0) {
    advisories.push({
      severity: "required",
      message: "Informe o nome completo.",
      sectionId: null,
    });
  }

  if (personal.email.length === 0 && personal.phone.length === 0) {
    advisories.push({
      severity: "required",
      message: "Informe ao menos um contato: e-mail ou telefone.",
      sectionId: null,
    });
  }

  if (personal.email.length > 0 && !isValidEmail(personal.email)) {
    advisories.push({
      severity: "required",
      message: "O e-mail informado é inválido.",
      sectionId: null,
    });
  }

  for (const url of [
    { value: personal.linkedin, label: "LinkedIn" },
    { value: personal.portfolio, label: "portfólio" },
  ]) {
    if (url.value.length > 0 && !isValidUrl(url.value)) {
      advisories.push({
        severity: "required",
        message: `O endereço do ${url.label} é inválido.`,
        sectionId: null,
      });
    }
  }

  for (const section of document.sections) {
    if (!section.visible) continue;

    if (isProseSection(section)) {
      if (section.content.trim().length === 0) {
        advisories.push({
          severity: "suggested",
          message: `A seção "${section.title}" está vazia.`,
          sectionId: section.id,
        });
      }
      continue;
    }

    if (!isItemSection(section)) continue;

    if (section.items.length === 0) {
      advisories.push({
        severity: "suggested",
        message: `A seção "${section.title}" não tem nenhum item.`,
        sectionId: section.id,
      });
      continue;
    }

    for (const item of section.items) {
      advisories.push(
        ...itemAdvisories(section.type, section.id, item as ItemLike),
      );
    }
  }

  return advisories;
}

interface ItemLike {
  id: string;
  company?: string;
  role?: string;
  institution?: string;
  course?: string;
  name?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  credentialUrl?: string;
  url?: string;
}

function itemAdvisories(
  type: string,
  sectionId: string,
  item: ItemLike,
): Advisory[] {
  const out: Advisory[] = [];
  const push = (message: string, severity: AdvisorySeverity = "required") =>
    out.push({ severity, message, sectionId, itemId: item.id });

  const blank = (value: string | undefined) =>
    (value ?? "").trim().length === 0;

  switch (type) {
    case "experience":
      if (blank(item.company)) push("Informe a empresa.");
      if (blank(item.role)) push("Informe o cargo.");
      break;
    case "education":
      if (blank(item.institution)) push("Informe a instituição.");
      if (blank(item.course)) push("Informe o curso.");
      break;
    case "custom":
      if (blank(item.title)) push("Informe um título.");
      break;
    default:
      if (blank(item.name)) push("Informe o nome.");
  }

  // Dates only apply where the item actually has a period.
  if ("startDate" in item || "endDate" in item) {
    const start = item.startDate ?? "";
    const end = item.endDate ?? "";
    const current = item.current ?? false;

    if (type === "experience" || type === "education") {
      if (start.length === 0) push("Informe a data de início.");
      if (!current && end.length === 0) {
        push("Informe a data de término ou marque como atual.");
      }
    }

    if (start.length > 0 && end.length > 0 && end < start) {
      push("O término não pode ser antes do início.");
    }
  }

  for (const url of [item.credentialUrl, item.url]) {
    if (url && url.length > 0 && !isValidUrl(url)) {
      push("O endereço informado é inválido.");
    }
  }

  return out;
}

export interface AdvisorySummary {
  required: number;
  suggested: number;
  total: number;
  /** Ready enough to hand to a client. */
  isPresentable: boolean;
}

export function summariseAdvisories(document: ResumeDocument): AdvisorySummary {
  const advisories = collectAdvisories(document);
  const required = advisories.filter((a) => a.severity === "required").length;
  const suggested = advisories.length - required;

  return {
    required,
    suggested,
    total: advisories.length,
    isPresentable: required === 0,
  };
}

/** Advisories for one section, for rendering the badge on its card. */
export function advisoriesForSection(
  document: ResumeDocument,
  sectionId: string,
): Advisory[] {
  return collectAdvisories(document).filter((a) => a.sectionId === sectionId);
}
