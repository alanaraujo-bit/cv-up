import { Children, isValidElement, type ReactNode } from "react";

import {
  isItemSection,
  isProseSection,
  type ResumeSection,
} from "@/features/resume/schemas/document";
import {
  LANGUAGE_LEVEL_LABEL,
  SKILL_CATEGORIES,
  SKILL_CATEGORY_LABEL,
  SKILL_CATEGORY_PLURAL,
  type CertificationItem,
  type CourseItem,
  type CustomItem,
  type EducationItem,
  type ExperienceItem,
  type LanguageItem,
  type ProjectItem,
  type SkillItem,
} from "@/features/resume/schemas/items";
import { formatMonthYear } from "@/features/resume/schemas/primitives";
import { cn } from "@/lib/utils";

import {
  formatLocation,
  formatPeriod,
  formatUrlLabel,
  paragraphs,
} from "../format";

/* -------------------------------------------------------------------------
   Blocks
   A block is the unit the paginator refuses to split. Everything a template
   puts on paper goes inside one.
------------------------------------------------------------------------- */

export function Block({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-block className={className}>
      {children}
    </div>
  );
}

/**
 * A heading and its entries. The heading is glued to the first entry so it can
 * never be left stranded at the foot of a page; every entry after that breaks
 * on its own.
 */
export function FlowSection({
  heading,
  children,
  className,
}: {
  heading: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const entries = Children.toArray(children).filter(
    (child) => isValidElement(child) || typeof child === "string",
  );

  const [first, ...rest] = entries;

  return (
    <section className={className}>
      <Block>
        {heading}
        {first}
      </Block>
      {rest.map((entry, index) => (
        <Block key={index}>{entry}</Block>
      ))}
    </section>
  );
}

/* -------------------------------------------------------------------------
   Text
------------------------------------------------------------------------- */

/** Free text as paragraphs. Marked selectable so it can be copied out. */
export function Prose({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const lines = paragraphs(text);
  if (lines.length === 0) return null;

  return (
    <div className={cn("space-y-[1.2mm] text-pretty", className)}>
      {lines.map((line, index) => (
        <p key={index}>{line}</p>
      ))}
    </div>
  );
}

export function Bullets({ items }: { items: readonly string[] }) {
  const visible = items.filter((item) => item.trim().length > 0);
  if (visible.length === 0) return null;

  return (
    <ul className="mt-[1.2mm] list-disc space-y-[0.8mm] pl-[4mm] text-pretty">
      {visible.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

/** Dot-separated supporting detail — `Empresa · São Paulo, SP`. */
export function MetaLine({
  parts,
  className,
}: {
  parts: readonly (string | null | undefined)[];
  className?: string;
}) {
  const visible = parts
    .map((part) => part?.trim() ?? "")
    .filter((part) => part.length > 0);

  if (visible.length === 0) return null;

  return (
    <p className={cn("paper-ink-soft", className)}>{visible.join(" · ")}</p>
  );
}

/**
 * Links stay real links: a résumé is read on a screen as often as on paper, and
 * `formatUrlLabel` already makes the visible text printable.
 */
export function PaperLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className="text-inherit no-underline">
      {children}
    </a>
  );
}

export function Photo({
  url,
  name,
  className,
}: {
  url: string;
  name: string;
  className?: string;
}) {
  return (
    // Streamed from an ownership-checked route rather than a public URL, so
    // next/image optimisation is deliberately bypassed — as in the editor.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name.trim().length > 0 ? `Foto de ${name}` : "Foto do currículo"}
      className={cn("block size-full object-cover", className)}
    />
  );
}

/* -------------------------------------------------------------------------
   Entries
   One shared renderer for all ten section types, so a fix to how a date or an
   achievement reads lands in every template at once. Templates differ in
   typography, rules and which column a section sits in — not in what a job
   entry is made of.
------------------------------------------------------------------------- */

/** Where an entry's period goes relative to its title. */
export type DateStyle =
  /** Under the title, with the rest of the supporting detail. */
  | "inline"
  /** Opposite the title on the same line — the classic two-column résumé. */
  | "right"
  /** In a fixed gutter to the left of the entry. */
  | "aside";

export interface EntryOptions {
  dateStyle: DateStyle;
  /** Renders skills and languages as one dense line instead of a list. */
  compactLists?: boolean;
}

function EntryHead({
  title,
  period,
  dateStyle,
}: {
  title: ReactNode;
  period: string;
  dateStyle: DateStyle;
}) {
  if (dateStyle === "right" && period.length > 0) {
    return (
      <div className="flex items-baseline justify-between gap-[3mm]">
        <p className="font-semibold">{title}</p>
        <time className="shrink-0 text-[8.5pt] paper-ink-soft">{period}</time>
      </div>
    );
  }

  return <p className="font-semibold">{title}</p>;
}

/** Wraps an entry in the left gutter layout when `dateStyle` is `aside`. */
function EntryShell({
  period,
  dateStyle,
  children,
}: {
  period: string;
  dateStyle: DateStyle;
  children: ReactNode;
}) {
  if (dateStyle !== "aside") return <>{children}</>;

  return (
    <div className="grid grid-cols-[26mm_1fr] gap-x-[4mm]">
      <time className="pt-[0.4mm] text-[8.5pt] paper-ink-faint">{period}</time>
      <div>{children}</div>
    </div>
  );
}

function ExperienceEntry({
  item,
  options,
}: {
  item: ExperienceItem;
  options: EntryOptions;
}) {
  const period = formatPeriod(item.startDate, item.endDate, item.current);
  const { dateStyle } = options;

  return (
    <EntryShell period={period} dateStyle={dateStyle}>
      <EntryHead title={item.role} period={period} dateStyle={dateStyle} />
      <MetaLine
        parts={[
          item.company,
          formatLocation(item.city, ""),
          dateStyle === "inline" ? period : null,
        ]}
        className="text-[9pt]"
      />
      <Prose text={item.description} className="mt-[1.2mm]" />
      <Bullets items={item.achievements} />
    </EntryShell>
  );
}

function EducationEntry({
  item,
  options,
}: {
  item: EducationItem;
  options: EntryOptions;
}) {
  const period = formatPeriod(item.startDate, item.endDate, item.current);
  const { dateStyle } = options;

  return (
    <EntryShell period={period} dateStyle={dateStyle}>
      <EntryHead title={item.course} period={period} dateStyle={dateStyle} />
      <MetaLine
        parts={[
          item.institution,
          item.degree,
          dateStyle === "inline" ? period : null,
        ]}
        className="text-[9pt]"
      />
      <Prose text={item.description} className="mt-[1.2mm]" />
    </EntryShell>
  );
}

function ProjectEntry({
  item,
  options,
}: {
  item: ProjectItem;
  options: EntryOptions;
}) {
  const period = formatPeriod(item.startDate, item.endDate);
  const { dateStyle } = options;

  return (
    <EntryShell period={period} dateStyle={dateStyle}>
      <EntryHead title={item.name} period={period} dateStyle={dateStyle} />
      {item.url.length > 0 ? (
        <p className="text-[9pt] paper-ink-accent">
          <PaperLink href={item.url}>{formatUrlLabel(item.url)}</PaperLink>
        </p>
      ) : null}
      <Prose text={item.description} className="mt-[1.2mm]" />
    </EntryShell>
  );
}

function CertificationEntry({ item }: { item: CertificationItem }) {
  return (
    <div>
      <p className="font-semibold">{item.name}</p>
      <MetaLine
        parts={[item.issuer, formatMonthYear(item.issuedAt)]}
        className="text-[9pt]"
      />
    </div>
  );
}

function CourseEntry({ item }: { item: CourseItem }) {
  return (
    <div>
      <p className="font-semibold">{item.name}</p>
      <MetaLine
        parts={[
          item.institution,
          item.hours.length > 0 ? `${item.hours}h` : null,
          formatMonthYear(item.completedAt),
        ]}
        className="text-[9pt]"
      />
    </div>
  );
}

function CustomEntry({ item }: { item: CustomItem }) {
  return (
    <div>
      <p className="font-semibold">{item.title}</p>
      <MetaLine parts={[item.subtitle]} className="text-[9pt]" />
      <Prose text={item.description} className="mt-[1.2mm]" />
    </div>
  );
}

function skillEntries(items: readonly SkillItem[], compact: boolean) {
  const named = items.filter((item) => item.name.trim().length > 0);

  if (compact) {
    // One line per category keeps a narrow sidebar from turning into a
    // one-word-per-line column.
    return SKILL_CATEGORIES.filter((category) =>
      named.some((item) => item.category === category),
    ).map((category) => (
      <div key={category}>
        <p className="text-[8.5pt] paper-ink-soft uppercase">
          {SKILL_CATEGORY_LABEL[category]}
        </p>
        <p className="text-pretty">
          {named
            .filter((item) => item.category === category)
            .map((item) => item.name)
            .join(" · ")}
        </p>
      </div>
    ));
  }

  return SKILL_CATEGORIES.filter((category) =>
    named.some((item) => item.category === category),
  ).map((category) => (
    <p key={category} className="text-pretty">
      <span className="font-semibold">{SKILL_CATEGORY_PLURAL[category]}: </span>
      {named
        .filter((item) => item.category === category)
        .map((item) => item.name)
        .join(" · ")}
    </p>
  ));
}

function languageEntries(items: readonly LanguageItem[], compact: boolean) {
  const named = items.filter((item) => item.name.trim().length > 0);
  if (named.length === 0) return [];

  if (compact) {
    return named.map((item) => (
      <p
        key={item.id}
        className="flex items-baseline justify-between gap-[2mm]"
      >
        <span>{item.name}</span>
        <span className="text-[8.5pt] paper-ink-soft">
          {LANGUAGE_LEVEL_LABEL[item.level]}
        </span>
      </p>
    ));
  }

  return [
    <p key="languages" className="text-pretty">
      {named
        .map((item) => `${item.name} (${LANGUAGE_LEVEL_LABEL[item.level]})`)
        .join(" · ")}
    </p>,
  ];
}

/**
 * One section's contents as a list of entries. `FlowSection` turns each into a
 * block; returning a list rather than a rendered section is what lets the
 * paginator break between entries.
 */
export function sectionEntries(
  section: ResumeSection,
  options: EntryOptions,
): ReactNode[] {
  if (isProseSection(section)) {
    return paragraphs(section.content).map((line, index) => (
      <p key={index} className="text-pretty">
        {line}
      </p>
    ));
  }

  if (!isItemSection(section)) return [];

  const compact = options.compactLists ?? false;

  switch (section.type) {
    case "experience":
      return section.items.map((item) => (
        <ExperienceEntry key={item.id} item={item} options={options} />
      ));
    case "education":
      return section.items.map((item) => (
        <EducationEntry key={item.id} item={item} options={options} />
      ));
    case "projects":
      return section.items.map((item) => (
        <ProjectEntry key={item.id} item={item} options={options} />
      ));
    case "certifications":
      return section.items.map((item) => (
        <CertificationEntry key={item.id} item={item} />
      ));
    case "courses":
      return section.items.map((item) => (
        <CourseEntry key={item.id} item={item} />
      ));
    case "custom":
      return section.items.map((item) => (
        <CustomEntry key={item.id} item={item} />
      ));
    case "skills":
      return skillEntries(section.items, compact);
    case "languages":
      return languageEntries(section.items, compact);
  }
}
