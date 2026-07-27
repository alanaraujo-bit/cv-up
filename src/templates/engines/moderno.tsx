import type { SectionType } from "@/features/resume/schemas/document";

import { contactEntries, printableSections } from "../format";
import {
  Block,
  FlowSection,
  PaperLink,
  Photo,
  sectionEntries,
} from "../paper/primitives";
import type { TemplateEngine, TemplateFlowProps } from "../types";

/**
 * Sections that read well in a narrow column: lists, not prose. Everything else
 * stays in the main column, in whatever order the user arranged it — the
 * routing only splits the flow, it never reorders it.
 */
const SIDEBAR_TYPES = new Set<SectionType>([
  "skills",
  "languages",
  "courses",
  "certifications",
]);

/**
 * The tinted band runs from the sheet edge to the middle of the gutter:
 * page margin (11mm) + sidebar column (52mm) + half the gap (4mm).
 */
const BAND_WIDTH = "67mm";

function Decoration() {
  return (
    <div className="paper-decoration">
      <div
        className="h-full border-r-[0.3mm] paper-rule-accent paper-bg-wash"
        style={{ width: BAND_WIDTH }}
      />
    </div>
  );
}

function SidebarHeading({ children }: { children: string }) {
  return (
    <h2 className="mb-[2mm] text-[8.5pt] font-semibold tracking-[0.14em] paper-ink-accent uppercase">
      {children}
    </h2>
  );
}

function MainHeading({ children }: { children: string }) {
  return (
    <h2 className="mb-[2.5mm] border-b-[0.3mm] paper-rule-accent pb-[1mm] text-[10pt] font-semibold tracking-[0.08em] paper-ink-accent uppercase">
      {children}
    </h2>
  );
}

function Flow({ document, photoUrl }: TemplateFlowProps) {
  const { personal } = document;
  const contacts = contactEntries(personal);
  const sections = printableSections(document);

  const sidebar = sections.filter((section) => SIDEBAR_TYPES.has(section.type));
  const main = sections.filter((section) => !SIDEBAR_TYPES.has(section.type));

  return (
    <div className="grid grid-cols-[52mm_1fr] gap-x-[8mm]">
      <div className="space-y-[6mm]">
        <Block className="space-y-[3mm]">
          {photoUrl ? (
            <div className="size-[34mm] overflow-hidden rounded-full border-[0.5mm] paper-rule-accent">
              <Photo url={photoUrl} name={personal.fullName} />
            </div>
          ) : null}

          <div>
            <h1 className="text-[15pt] leading-[1.15] font-semibold tracking-[-0.01em]">
              {personal.fullName}
            </h1>
            {personal.headline.length > 0 ? (
              <p className="mt-[1mm] text-[9.5pt] paper-ink-soft">
                {personal.headline}
              </p>
            ) : null}
          </div>

          {contacts.length > 0 ? (
            <ul className="space-y-[1mm] text-[8.5pt] break-words">
              {contacts.map((contact) => (
                <li key={contact.key}>
                  {contact.href ? (
                    <PaperLink href={contact.href}>{contact.text}</PaperLink>
                  ) : (
                    contact.text
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </Block>

        {sidebar.map((section) => (
          <FlowSection
            key={section.id}
            className="space-y-[2.5mm] text-[9pt]"
            heading={<SidebarHeading>{section.title}</SidebarHeading>}
          >
            {sectionEntries(section, {
              dateStyle: "inline",
              compactLists: true,
            })}
          </FlowSection>
        ))}
      </div>

      <div className="space-y-[6mm]">
        {main.map((section) => (
          <FlowSection
            key={section.id}
            className="space-y-[3.5mm]"
            heading={<MainHeading>{section.title}</MainHeading>}
          >
            {sectionEntries(section, { dateStyle: "right" })}
          </FlowSection>
        ))}
      </div>
    </div>
  );
}

export const moderno: TemplateEngine = {
  key: "moderno",
  name: "Moderno",
  supportsPhoto: true,
  theme: {
    accent: "oklch(0.5 0.19 268)",
    fontFamily: "sans",
    baseSize: "9.5pt",
    leading: 1.45,
    marginX: "11mm",
  },
  Decoration,
  Flow,
};
