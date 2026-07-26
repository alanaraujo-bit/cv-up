import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { requireGuest } from "@/server/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireGuest();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="safe-top safe-x">
        <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-5">
          <Link href="/" aria-label="Ir para a página inicial">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-8 safe-x">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <div className="h-6 safe-bottom" />
    </div>
  );
}
