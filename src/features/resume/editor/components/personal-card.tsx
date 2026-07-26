"use client";

import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";

import type { PersonalInfo } from "../../schemas/document";
import { PhotoField } from "./photo-field";

export function PersonalCard({
  resumeId,
  personal,
  onChange,
}: {
  resumeId: string;
  personal: PersonalInfo;
  onChange: (patch: Partial<PersonalInfo>) => void;
}) {
  return (
    <section
      className="space-y-4 rounded-xl border bg-card p-4"
      aria-label="Dados pessoais"
    >
      <h2 className="text-sm font-medium">Dados pessoais</h2>

      <PhotoField
        resumeId={resumeId}
        photo={personal.photo}
        onChange={(photo) => onChange({ photo })}
      />

      <Field label="Nome completo">
        {(props) => (
          <Input
            {...props}
            value={personal.fullName}
            onChange={(event) => onChange({ fullName: event.target.value })}
            autoComplete="off"
          />
        )}
      </Field>

      <Field
        label="Título profissional"
        optional
        hint="Aparece abaixo do nome. Ex.: Analista Financeiro."
      >
        {(props) => (
          <Input
            {...props}
            value={personal.headline}
            onChange={(event) => onChange({ headline: event.target.value })}
          />
        )}
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="E-mail" optional>
          {(props) => (
            <Input
              {...props}
              type="email"
              inputMode="email"
              value={personal.email}
              onChange={(event) => onChange({ email: event.target.value })}
            />
          )}
        </Field>

        <Field label="Telefone" optional>
          {(props) => (
            <Input
              {...props}
              type="tel"
              inputMode="tel"
              placeholder="(11) 99999-0000"
              value={personal.phone}
              onChange={(event) => onChange({ phone: event.target.value })}
            />
          )}
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
        <Field label="Cidade" optional>
          {(props) => (
            <Input
              {...props}
              value={personal.city}
              onChange={(event) => onChange({ city: event.target.value })}
            />
          )}
        </Field>

        <Field label="Estado" optional>
          {(props) => (
            <Input
              {...props}
              placeholder="SP"
              value={personal.state}
              onChange={(event) => onChange({ state: event.target.value })}
            />
          )}
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="LinkedIn" optional>
          {(props) => (
            <Input
              {...props}
              inputMode="url"
              placeholder="linkedin.com/in/usuario"
              value={personal.linkedin}
              onChange={(event) => onChange({ linkedin: event.target.value })}
            />
          )}
        </Field>

        <Field label="Portfólio" optional>
          {(props) => (
            <Input
              {...props}
              inputMode="url"
              value={personal.portfolio}
              onChange={(event) => onChange({ portfolio: event.target.value })}
            />
          )}
        </Field>
      </div>
    </section>
  );
}
