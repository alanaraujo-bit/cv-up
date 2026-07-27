import { contactEntries, printableSections } from "../format";
import {
  Block,
  FlowSection,
  PaperLink,
  sectionEntries,
} from "../paper/primitives";
import type { TemplateEngine, TemplateFlowProps } from "../types";

/**
 * Minimalista — one column, a lot of air, and a left gutter that carries the
 * dates so the entries themselves stay a clean vertical line. Nothing but the
 * hairline rules is drawn; the structure comes from spacing.
 */
function Heading({ children }: { children: string }) {
  return (
    <h2 className="mb-[2.5mm] text-[8.5pt] font-medium tracking-[0.18em] paper-ink-faint uppercase">
      {children}
    </h2>
  );
}

function Flow({ document }: TemplateFlowProps) {
  const { personal } = document;
  const contacts = contactEntries(personal);

  return (
    <div className="space-y-[7mm]">
      <Block className="border-b paper-rule pb-[5mm]">
        <h1 className="text-[21pt] leading-[1.1] font-light tracking-[-0.01em]">
          {personal.fullName}
        </h1>

        {personal.headline.length > 0 ? (
          <p className="mt-[1.5mm] text-[10.5pt] paper-ink-soft">
            {personal.headline}
          </p>
        ) : null}

        {contacts.length > 0 ? (
          <p className="mt-[3mm] text-[9pt] paper-ink-soft">
            {contacts.map((contact, index) => (
              <span key={contact.key}>
                {index > 0 ? <span className="px-[1.5mm]">·</span> : null}
                {contact.href ? (
                  <PaperLink href={contact.href}>{contact.text}</PaperLink>
                ) : (
                  contact.text
                )}
              </span>
            ))}
          </p>
        ) : null}
      </Block>

      {printableSections(document).map((section) => (
        <FlowSection
          key={section.id}
          className="space-y-[4mm]"
          heading={<Heading>{section.title}</Heading>}
        >
          {sectionEntries(section, { dateStyle: "aside" })}
        </FlowSection>
      ))}
    </div>
  );
}

export const minimalista: TemplateEngine = {
  key: "minimalista",
  name: "Minimalista",
  supportsPhoto: false,
  theme: {
    accent: "oklch(0.28 0.02 268)",
    fontFamily: "sans",
    baseSize: "10pt",
    leading: 1.5,
    marginX: "20mm",
  },
  Flow,
};
