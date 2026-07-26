"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Search } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { CommandPalette } from "@/components/layout/command-palette";
import { UserMenu } from "@/components/layout/user-menu";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";

/** The value never changes after load, so there is nothing to subscribe to. */
const noSubscribe = () => () => {};

const readShortcut = () =>
  /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "⌘K" : "Ctrl K";

export function AppTopbar({
  name,
  email,
  image,
}: {
  name: string;
  email: string;
  image: string | null;
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  // The modifier key differs per platform, which the server cannot know.
  // `useSyncExternalStore` renders null on the server and the real value on the
  // client without a hydration mismatch or a setState-in-effect round trip.
  const shortcut = useSyncExternalStore(noSubscribe, readShortcut, () => null);

  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 safe-top safe-x backdrop-blur-md">
      <div className="flex h-14 items-center gap-2 px-4">
        {/* The sidebar already shows the logo on desktop. */}
        <Link
          href="/painel"
          aria-label="Ir para o painel"
          className="lg:hidden"
        >
          <Logo showWordmark={false} />
        </Link>

        <div className="flex-1">
          <Button
            variant="outline"
            onClick={() => setPaletteOpen(true)}
            aria-label="Abrir busca de comandos"
            className="hidden h-8 w-full max-w-xs justify-start gap-2 font-normal text-muted-foreground lg:flex"
          >
            <Search className="size-4" />
            Buscar…
            {shortcut ? (
              <span className="ml-auto rounded bg-muted px-1.5 py-0.5 font-mono text-[0.65rem]">
                {shortcut}
              </span>
            ) : null}
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setPaletteOpen(true)}
          aria-label="Abrir busca de comandos"
          className="lg:hidden"
        >
          <Search className="size-4" />
        </Button>

        <ThemeToggle />
        <UserMenu name={name} email={email} image={image} />
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}
