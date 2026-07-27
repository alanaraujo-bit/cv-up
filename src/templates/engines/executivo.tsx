import { contactEntries, printableSections } from "../format";
import {
  Block,
  FlowSection,
  PaperLink,
  sectionEntries,
} from "../paper/primitives";
import type { TemplateEngine, TemplateFlowProps } from "../types";

/**
 * Executivo — serif, dense, sober. It exists to fit a long career on two pages
 * without looking cramped, so the type is a notch smaller and the leading
 * tighter than the other templates; the accent is spent only on rules.
 */
function Heading({ children }: { children: string }) {
  return (
    <h2 className="mb-[2.5mm] border-b-[0.4mm] paper-rule-strong pb-[1.2mm] text-[10pt] font-semibold tracking-[0.12em] uppercase">
      {children}
    </h2>
  );
}

function Flow({ document }: TemplateFlowProps) {
  const { personal } = document;
  const contacts = contactEntries(personal);

  return (
    <div className="space-y-[5.5mm]">
      <Block className="border-b-[0.8mm] paper-rule-strong pb-[3mm]">
        <div className="flex items-end justify-between gap-[6mm]">
          <div className="min-w-0">
            <h1 className="text-[19pt] leading-[1.1] font-semibold tracking-[0.01em]">
              {personal.fullName}
            </h1>
            {personal.headline.length > 0 ? (
              <p className="mt-[1.5mm] text-[10.5pt] tracking-[0.04em] paper-ink-accent uppercase">
                {personal.headline}
              </p>
            ) : null}
          </div>

          {contacts.length > 0 ? (
            <ul className="shrink-0 space-y-[0.6mm] text-right text-[8.5pt] paper-ink-soft">
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
        </div>
      </Block>

      {printableSections(document).map((section) => (
        <FlowSection
          key={section.id}
          className="space-y-[3mm]"
          heading={<Heading>{section.title}</Heading>}
        >
          {sectionEntries(section, { dateStyle: "right" })}
        </FlowSection>
      ))}
    </div>
  );
}

export const executivo: TemplateEngine = {
  key: "executivo",
  name: "Executivo",
  supportsPhoto: false,
  theme: {
    accent: "oklch(0.32 0.05 258)",
    fontFamily: "serif",
    baseSize: "9.5pt",
    leading: 1.4,
    marginX: "16mm",
  },
  Flow,
};
