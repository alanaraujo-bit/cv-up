# CV UP

Plataforma profissional para criar, revisar e gerenciar currículos — e os
clientes para quem eles são feitos.

Interface, conteúdo e documentos gerados em **português do Brasil**. Código e
documentação técnica em inglês.

---

## Stack

| Camada         | Tecnologia                                       |
| -------------- | ------------------------------------------------ |
| Framework      | Next.js 16 (App Router, React 19)                |
| Linguagem      | TypeScript (strict + `noUncheckedIndexedAccess`) |
| UI             | Tailwind CSS 4, shadcn/ui (Radix), Lucide        |
| Banco          | PostgreSQL + Prisma _(fase 1)_                   |
| Autenticação   | Better Auth _(fase 1)_                           |
| PDF            | Playwright em serviço dedicado _(fase 5)_        |
| PWA            | Serwist                                          |
| Testes         | Vitest + Testing Library                         |
| Infraestrutura | Vercel (app) · Railway (banco e serviço de PDF)  |

## Começando

```bash
pnpm install
cp .env.example .env.local   # ajuste os valores
pnpm dev                     # http://localhost:3000
```

Requer Node 22+ e pnpm.

### Scripts

| Comando       | O que faz                                   |
| ------------- | ------------------------------------------- |
| `pnpm dev`    | Servidor de desenvolvimento (Turbopack)     |
| `pnpm build`  | Build de produção (webpack — ver ADR 0005)  |
| `pnpm start`  | Sobe o build de produção                    |
| `pnpm verify` | Typecheck + lint + formatação + testes      |
| `pnpm test`   | Testes unitários                            |
| `pnpm format` | Formata com Prettier                        |
| `pnpm icons`  | Regenera os ícones do PWA a partir do vetor |

O service worker só é gerado em builds de produção. Para testar o PWA:
`pnpm build && pnpm start`.

## Estrutura

```
src/
├─ app/            rotas (App Router), manifest e service worker
├─ components/
│  ├─ ui/          primitivas shadcn/ui
│  ├─ brand/       logo e identidade
│  ├─ providers/   providers de contexto
│  └─ shared/      componentes reutilizáveis de app
├─ features/       vertical slices por domínio (a partir da fase 1)
├─ lib/            env validado, configuração do site, utilitários
└─ server/         acesso a dados e guards (a partir da fase 1)

docs/
├─ architecture.md arquitetura e convenções
├─ roadmap.md      fases de desenvolvimento e status
└─ decisions/      ADRs — decisões técnicas registradas
```

## Documentação

- [Arquitetura](docs/architecture.md)
- [Roteiro de desenvolvimento](docs/roadmap.md)
- [Decisões técnicas (ADRs)](docs/decisions/)
