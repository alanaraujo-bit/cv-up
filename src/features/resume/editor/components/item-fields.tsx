"use client";

import { Field } from "@/components/forms/field";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import { Textarea } from "@/components/ui/textarea";

import {
  LANGUAGE_LEVEL_LABEL,
  LANGUAGE_LEVELS,
  SKILL_CATEGORIES,
  SKILL_CATEGORY_LABEL,
} from "../../schemas/items";
import type { ItemSection } from "../../schemas/document";
import { MonthYearInput } from "./month-year-input";

type Patch = Record<string, unknown>;
type Item = Record<string, unknown>;

interface ItemFieldsProps {
  type: ItemSection["type"];
  item: Item;
  onChange: (patch: Patch) => void;
}

const text = (item: Item, key: string) =>
  (item[key] as string | undefined) ?? "";

/** The period block, shared by experience and education. */
function PeriodFields({ item, onChange }: Omit<ItemFieldsProps, "type">) {
  const current = Boolean(item["current"]);

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Início">
          {(props) => (
            <MonthYearInput
              {...props}
              value={text(item, "startDate")}
              onChange={(value) => onChange({ startDate: value })}
            />
          )}
        </Field>

        <Field label="Término">
          {(props) => (
            <MonthYearInput
              {...props}
              value={text(item, "endDate")}
              onChange={(value) => onChange({ endDate: value })}
              disabled={current}
            />
          )}
        </Field>
      </div>

      <CheckboxField
        label="Atual"
        checked={current}
        onCheckedChange={(checked) =>
          // Clear the end date so a stale value cannot resurface if the user
          // unticks and forgets.
          onChange({ current: checked, ...(checked ? { endDate: "" } : {}) })
        }
      />
    </>
  );
}

export function ItemFields({ type, item, onChange }: ItemFieldsProps) {
  switch (type) {
    case "experience":
      return (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Empresa">
              {(props) => (
                <Input
                  {...props}
                  value={text(item, "company")}
                  onChange={(e) => onChange({ company: e.target.value })}
                />
              )}
            </Field>
            <Field label="Cargo">
              {(props) => (
                <Input
                  {...props}
                  value={text(item, "role")}
                  onChange={(e) => onChange({ role: e.target.value })}
                />
              )}
            </Field>
          </div>

          <Field label="Cidade" optional>
            {(props) => (
              <Input
                {...props}
                value={text(item, "city")}
                onChange={(e) => onChange({ city: e.target.value })}
              />
            )}
          </Field>

          <PeriodFields item={item} onChange={onChange} />

          <Field
            label="Atividades e resultados"
            optional
            hint="Uma linha por atividade. Comece com um verbo de ação."
          >
            {(props) => (
              <Textarea
                {...props}
                rows={4}
                value={text(item, "description")}
                onChange={(e) => onChange({ description: e.target.value })}
              />
            )}
          </Field>
        </>
      );

    case "education":
      return (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Instituição">
              {(props) => (
                <Input
                  {...props}
                  value={text(item, "institution")}
                  onChange={(e) => onChange({ institution: e.target.value })}
                />
              )}
            </Field>
            <Field label="Curso">
              {(props) => (
                <Input
                  {...props}
                  value={text(item, "course")}
                  onChange={(e) => onChange({ course: e.target.value })}
                />
              )}
            </Field>
          </div>

          <Field
            label="Grau"
            optional
            hint="Ex.: Bacharelado, Técnico, Pós-graduação."
          >
            {(props) => (
              <Input
                {...props}
                value={text(item, "degree")}
                onChange={(e) => onChange({ degree: e.target.value })}
              />
            )}
          </Field>

          <PeriodFields item={item} onChange={onChange} />
        </>
      );

    case "skills":
      return (
        <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
          <Field label="Competência">
            {(props) => (
              <Input
                {...props}
                value={text(item, "name")}
                onChange={(e) => onChange({ name: e.target.value })}
              />
            )}
          </Field>
          <Field label="Tipo">
            {(props) => (
              <SelectNative
                {...props}
                value={text(item, "category")}
                onChange={(e) => onChange({ category: e.target.value })}
              >
                {SKILL_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {SKILL_CATEGORY_LABEL[category]}
                  </option>
                ))}
              </SelectNative>
            )}
          </Field>
        </div>
      );

    case "languages":
      return (
        <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
          <Field label="Idioma">
            {(props) => (
              <Input
                {...props}
                value={text(item, "name")}
                onChange={(e) => onChange({ name: e.target.value })}
              />
            )}
          </Field>
          <Field label="Nível">
            {(props) => (
              <SelectNative
                {...props}
                value={text(item, "level")}
                onChange={(e) => onChange({ level: e.target.value })}
              >
                {LANGUAGE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {LANGUAGE_LEVEL_LABEL[level]}
                  </option>
                ))}
              </SelectNative>
            )}
          </Field>
        </div>
      );

    case "certifications":
      return (
        <>
          <Field label="Certificação">
            {(props) => (
              <Input
                {...props}
                value={text(item, "name")}
                onChange={(e) => onChange({ name: e.target.value })}
              />
            )}
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Emissor" optional>
              {(props) => (
                <Input
                  {...props}
                  value={text(item, "issuer")}
                  onChange={(e) => onChange({ issuer: e.target.value })}
                />
              )}
            </Field>
            <Field label="Emissão" optional>
              {(props) => (
                <MonthYearInput
                  {...props}
                  value={text(item, "issuedAt")}
                  onChange={(value) => onChange({ issuedAt: value })}
                />
              )}
            </Field>
          </div>
          <Field label="Link da credencial" optional>
            {(props) => (
              <Input
                {...props}
                type="url"
                inputMode="url"
                value={text(item, "credentialUrl")}
                onChange={(e) => onChange({ credentialUrl: e.target.value })}
              />
            )}
          </Field>
        </>
      );

    case "projects":
      return (
        <>
          <Field label="Projeto">
            {(props) => (
              <Input
                {...props}
                value={text(item, "name")}
                onChange={(e) => onChange({ name: e.target.value })}
              />
            )}
          </Field>
          <Field label="Link" optional>
            {(props) => (
              <Input
                {...props}
                type="url"
                inputMode="url"
                value={text(item, "url")}
                onChange={(e) => onChange({ url: e.target.value })}
              />
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Início" optional>
              {(props) => (
                <MonthYearInput
                  {...props}
                  value={text(item, "startDate")}
                  onChange={(value) => onChange({ startDate: value })}
                />
              )}
            </Field>
            <Field label="Término" optional>
              {(props) => (
                <MonthYearInput
                  {...props}
                  value={text(item, "endDate")}
                  onChange={(value) => onChange({ endDate: value })}
                />
              )}
            </Field>
          </div>
          <Field label="Descrição" optional>
            {(props) => (
              <Textarea
                {...props}
                rows={3}
                value={text(item, "description")}
                onChange={(e) => onChange({ description: e.target.value })}
              />
            )}
          </Field>
        </>
      );

    case "courses":
      return (
        <>
          <Field label="Curso">
            {(props) => (
              <Input
                {...props}
                value={text(item, "name")}
                onChange={(e) => onChange({ name: e.target.value })}
              />
            )}
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Instituição" optional className="sm:col-span-1">
              {(props) => (
                <Input
                  {...props}
                  value={text(item, "institution")}
                  onChange={(e) => onChange({ institution: e.target.value })}
                />
              )}
            </Field>
            <Field label="Carga horária" optional>
              {(props) => (
                <Input
                  {...props}
                  inputMode="numeric"
                  placeholder="40"
                  value={text(item, "hours")}
                  onChange={(e) =>
                    onChange({ hours: e.target.value.replace(/\D/g, "") })
                  }
                />
              )}
            </Field>
            <Field label="Conclusão" optional>
              {(props) => (
                <MonthYearInput
                  {...props}
                  value={text(item, "completedAt")}
                  onChange={(value) => onChange({ completedAt: value })}
                />
              )}
            </Field>
          </div>
        </>
      );

    case "custom":
      return (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Título">
              {(props) => (
                <Input
                  {...props}
                  value={text(item, "title")}
                  onChange={(e) => onChange({ title: e.target.value })}
                />
              )}
            </Field>
            <Field label="Subtítulo" optional>
              {(props) => (
                <Input
                  {...props}
                  value={text(item, "subtitle")}
                  onChange={(e) => onChange({ subtitle: e.target.value })}
                />
              )}
            </Field>
          </div>
          <Field label="Descrição" optional>
            {(props) => (
              <Textarea
                {...props}
                rows={3}
                value={text(item, "description")}
                onChange={(e) => onChange({ description: e.target.value })}
              />
            )}
          </Field>
        </>
      );
  }
}
