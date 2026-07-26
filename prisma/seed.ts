import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";

import { PrismaClient } from "../src/generated/prisma/client";
import { TemplateCategory } from "../src/generated/prisma/enums";

loadEnv({ path: [".env.local", ".env"], quiet: true });

const connectionString =
  process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"];
if (!connectionString) throw new Error("DATABASE_URL is not set");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

/**
 * The template catalogue. `engineKey` is what src/templates/registry.ts maps to
 * a React component, so it must stay stable once a resume references it.
 */
const TEMPLATES = [
  {
    slug: "moderno",
    engineKey: "moderno",
    name: "Moderno",
    description:
      "Layout em duas colunas com destaque para competências. Bom para a maioria das áreas.",
    category: TemplateCategory.MODERN,
    accentColor: "#4062e0",
    supportsPhoto: true,
    atsSafe: false,
    sortOrder: 10,
  },
  {
    slug: "executivo",
    engineKey: "executivo",
    name: "Executivo",
    description:
      "Sóbrio e denso, com ênfase em resultados e trajetória. Indicado para cargos de liderança.",
    category: TemplateCategory.EXECUTIVE,
    accentColor: "#1f2a44",
    supportsPhoto: false,
    atsSafe: true,
    sortOrder: 20,
  },
  {
    slug: "minimalista",
    engineKey: "minimalista",
    name: "Minimalista",
    description:
      "Coluna única, tipografia generosa e muito espaço em branco. Elegante e fácil de ler.",
    category: TemplateCategory.MINIMAL,
    accentColor: "#111827",
    supportsPhoto: false,
    atsSafe: true,
    sortOrder: 30,
  },
  {
    slug: "tecnologia",
    engineKey: "tecnologia",
    name: "Tecnologia",
    description:
      "Espaço amplo para stack, projetos e repositórios. Feito para áreas técnicas.",
    category: TemplateCategory.TECH,
    accentColor: "#0f766e",
    supportsPhoto: false,
    atsSafe: true,
    sortOrder: 40,
  },
  {
    slug: "administrativo",
    engineKey: "administrativo",
    name: "Administrativo",
    description:
      "Estrutura clara e formal, com foco em rotinas, sistemas e certificações.",
    category: TemplateCategory.ADMIN,
    accentColor: "#334155",
    supportsPhoto: true,
    atsSafe: true,
    sortOrder: 50,
  },
  {
    slug: "primeiro-emprego",
    engineKey: "primeiro-emprego",
    name: "Primeiro Emprego",
    description:
      "Valoriza formação, cursos e projetos quando ainda há pouca experiência.",
    category: TemplateCategory.FIRST_JOB,
    accentColor: "#7c3aed",
    supportsPhoto: true,
    atsSafe: true,
    sortOrder: 60,
  },
  {
    slug: "ats",
    engineKey: "ats",
    name: "ATS Friendly",
    description:
      "Sem colunas, ícones ou gráficos. Máxima compatibilidade com triagem automática.",
    category: TemplateCategory.ATS,
    accentColor: "#000000",
    supportsPhoto: false,
    atsSafe: true,
    sortOrder: 70,
  },
] as const;

async function main() {
  for (const template of TEMPLATES) {
    await db.template.upsert({
      where: { slug: template.slug },
      create: template,
      update: template,
    });
  }
  console.log(`seed: ${TEMPLATES.length} templates upserted`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => void db.$disconnect());
