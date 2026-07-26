import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { UserMenu } from "@/components/layout/user-menu";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { requireSession } from "@/server/session";

/**
 * Minimal shell for phase 1 — sidebar, bottom navigation and the command
 * palette arrive in phase 2. The session guard here is the authoritative one;
 * the middleware redirect is only an optimisation.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b bg-background/80 safe-top safe-x backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/painel" aria-label="Ir para o painel">
            <Logo />
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserMenu
              name={session.user.name}
              email={session.user.email}
              image={session.user.image ?? null}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 safe-x">
        {children}
      </main>

      <div className="h-4 safe-bottom" />
    </div>
  );
}
