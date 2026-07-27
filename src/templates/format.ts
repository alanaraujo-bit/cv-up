import {
  isItemSection,
  isProseSection,
  type PersonalInfo,
  type ResumeDocument,
  type ResumeSection,
} from "@/features/resume/schemas/document";
import { formatMonthYear } from "@/features/resume/schemas/primitives";

/**
 * En dash between plain spaces. A hyphen reads as a subtraction, and the
 * typographically nicer thin spaces mangle the text an ATS pulls out of the
 * PDF — several of these templates exist precisely to survive that.
 */
const RANGE_SEPARATOR = " – ";

/**
 * `03/2020 – atual`, `03/2020 – 08/2022`, or whichever end is known. An unknown
 * period prints nothing rather than a dangling dash: the editor already tells
 * the user the date is missing, and the résumé must never look broken.
 */
export function formatPeriod(
  startDate: string,
  endDate: string,
  current = false,
): string {
  const start = formatMonthYear(startDate);
  const end = current ? "atual" : formatMonthYear(endDate);

  if (start && end) return `${start}${RANGE_SEPARATOR}${end}`;
  return start || end || "";
}

/** `São Paulo, SP` — either half may be missing. */
export function formatLocation(city: string, state: string): string {
  return [city.trim(), state.trim()].filter(Boolean).join(", ");
}

/**
 * A URL as a person would write it on paper: no scheme, no `www.`, no trailing
 * slash. The stored value keeps the scheme so the link still works when the PDF
 * is read on a screen.
 */
export function formatUrlLabel(url: string): string {
  return url
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "");
}

export interface ContactEntry {
  key: string;
  text: string;
  href?: string;
}

/**
 * The contact line, in the order a Brazilian résumé reads: where to reach the
 * person first, then where to find them. Blanks are dropped, never padded.
 */
export function contactEntries(personal: PersonalInfo): ContactEntry[] {
  const entries: ContactEntry[] = [];
  const push = (key: string, text: string, href?: string) => {
    if (text.trim().length > 0) entries.push({ key, text, href });
  };

  push("phone", personal.phone, `tel:${personal.phone.replace(/\s/g, "")}`);
  push("email", personal.email, `mailto:${personal.email}`);
  push("location", formatLocation(personal.city, personal.state));
  push("linkedin", formatUrlLabel(personal.linkedin), personal.linkedin);
  push("portfolio", formatUrlLabel(personal.portfolio), personal.portfolio);

  return entries;
}

/** Free text split into paragraphs, so a typed line break survives to paper. */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Sections worth printing: visible, and with something in them. A heading with
 * nothing underneath is the classic way a generated résumé looks unfinished —
 * the editor still shows the empty section so the user knows it exists.
 */
export function printableSections(document: ResumeDocument): ResumeSection[] {
  return document.sections.filter((section) => {
    if (!section.visible) return false;
    if (isProseSection(section)) return section.content.trim().length > 0;
    if (isItemSection(section)) return section.items.length > 0;
    return false;
  });
}

/** True when there is nothing at all to show — drives the preview's empty state. */
export function isDocumentBlank(document: ResumeDocument): boolean {
  const { personal } = document;
  const hasIdentity =
    personal.fullName.trim().length > 0 ||
    personal.headline.trim().length > 0 ||
    contactEntries(personal).length > 0;

  return !hasIdentity && printableSections(document).length === 0;
}
