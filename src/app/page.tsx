import Link from "next/link";
import { Check, Circle } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { InstallPrompt } from "@/components/shared/install-prompt";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";
import { getSession } from "@/server/session";

/**
 * Public home. It exercises the design system and the PWA install path, and is
 * replaced by the real marketing page in phase 10.
 */
const ROADMAP = [
  { phase: "Fase 0", title: "Fundação e arquitetura", done: true },
  { phase: "Fase 1", title: "Banco de dados e autenticação", done: true },
  { phase: "Fase 2", title: "Shell do app e painel", done: true },
  { phase: "Fase 3", title: "Editor de currículos", done: true },
  { phase: "Fase 4", title: "Motor de modelos e preview", done: false },
  { phase: "Fase 5", title: "Exportação em PDF", done: false },
  { phase: "Fase 6", title: "Gestão de clientes", done: false },
  { phase: "Fase 7", title: "Histórico de versões", done: false },
  { phase: "Fase 8", title: "Modelos finais e polimento", done: false },
  { phase: "Fase 9", title: "Recursos com IA", done: false },
  { phase: "Fase 10", title: "Preparação para SaaS", done: false },
] as const;

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 safe-top safe-x backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {session ? (
              <Button asChild size="sm">
                <Link href="/painel">Ir para o painel</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/entrar">Entrar</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/criar-conta">Criar conta</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-14 safe-x sm:py-20">
        <Badge variant="secondary">Fase 3 · Editor de currículos</Badge>

        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
          {site.tagline}
        </h1>

        <p
          data-selectable
          className="mt-4 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg"
        >
          {site.description}
        </p>

        <div className="mt-8">
          <InstallPrompt />
        </div>

        <section className="mt-16" aria-labelledby="roadmap-title">
          <h2
            id="roadmap-title"
            className="text-xs font-medium tracking-widest text-muted-foreground uppercase"
          >
            Roteiro de desenvolvimento
          </h2>

          <ol className="mt-4 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
            {ROADMAP.map((item) => (
              <li
                key={item.phase}
                className="flex items-center gap-3 bg-card px-4 py-3"
              >
                {item.done ? (
                  <Check className="size-4 shrink-0 text-success" />
                ) : (
                  <Circle className="size-4 shrink-0 text-muted-foreground/40" />
                )}
                <span className="w-14 shrink-0 text-xs text-muted-foreground">
                  {item.phase}
                </span>
                <span
                  className={
                    item.done
                      ? "text-sm font-medium"
                      : "text-sm text-muted-foreground"
                  }
                >
                  {item.title}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t safe-x safe-bottom">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 text-xs text-muted-foreground">
          {site.name} · {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
