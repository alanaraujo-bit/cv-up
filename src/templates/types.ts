import type { ResumeDocument } from "@/features/resume/schemas/document";

/**
 * The visual identity of one template, expressed entirely as values the paper
 * token layer in `globals.css` already understands. A template never hardcodes
 * a colour; it hands one to the token layer and the primitives read it back.
 */
export interface TemplateTheme {
  /** The single colour a template is allowed to choose. */
  accent: string;
  /** Text drawn *on* the accent — checked against it by hand, not derived. */
  accentContrast?: string;
  /** `--font-sans` or `--font-serif`. */
  fontFamily: "sans" | "serif";
  /** Base type size. Templates trade size against how much fits on a page. */
  baseSize: string;
  leading: number;
  /** Horizontal page margin. Vertical margin is fixed — see `globals.css`. */
  marginX: string;
}

export interface TemplateFlowProps {
  document: ResumeDocument;
  /**
   * Ownership-checked URL for the photo, or null when there is none. Templates
   * that do not support a photo ignore it.
   */
  photoUrl: string | null;
}

export interface TemplateEngine {
  /** Matches `Template.engineKey` in the database. Never rename one. */
  key: string;
  name: string;
  theme: TemplateTheme;
  supportsPhoto: boolean;
  /**
   * Full-bleed chrome painted behind every sheet — colour bands and the like.
   * It is per *page*, not part of the flow, so it survives a page break.
   */
  Decoration?: () => React.ReactNode;
  /**
   * The document as an ordered flow. Every direct descendant that must not be
   * split across a page carries `data-block`; the paginator and the print
   * stylesheet both key off exactly that attribute.
   */
  Flow: (props: TemplateFlowProps) => React.ReactNode;
}

/** Inline custom properties handed to the sheet, consumed by the token layer. */
export function themeStyle(theme: TemplateTheme): React.CSSProperties {
  return {
    "--accent": theme.accent,
    "--accent-contrast": theme.accentContrast ?? "#fff",
    "--paper-font":
      theme.fontFamily === "serif" ? "var(--font-serif)" : "var(--font-sans)",
    "--paper-base": theme.baseSize,
    "--paper-leading": String(theme.leading),
    "--page-margin-x": theme.marginX,
  } as React.CSSProperties;
}
