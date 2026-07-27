import { executivo } from "./engines/executivo";
import { minimalista } from "./engines/minimalista";
import { moderno } from "./engines/moderno";
import type { TemplateEngine } from "./types";

/**
 * `Template.engineKey` in the database resolves here. A key is a permanent
 * identifier — résumés reference it — so an engine may be rewritten but never
 * renamed.
 *
 * This registry is also the definition of which templates the product actually
 * has: the catalogue only lists templates with an engine (see
 * `features/template/service.ts`), which is how the four templates still to be
 * built in phase 8 stay out of the picker instead of rendering as nothing.
 */
const ENGINES: readonly TemplateEngine[] = [moderno, executivo, minimalista];

const BY_KEY = new Map(ENGINES.map((engine) => [engine.key, engine]));

export const RENDERABLE_ENGINE_KEYS: string[] = ENGINES.map(
  (engine) => engine.key,
);

export function getTemplateEngine(
  engineKey: string | null | undefined,
): TemplateEngine | null {
  if (!engineKey) return null;
  return BY_KEY.get(engineKey) ?? null;
}

export function isRenderableEngine(engineKey: string): boolean {
  return BY_KEY.has(engineKey);
}
