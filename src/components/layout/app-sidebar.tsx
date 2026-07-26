"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { NAV_ITEMS, isNavItemActive } from "@/config/navigation";
import { cn } from "@/lib/utils";

/** Desktop navigation. Hidden below `lg`, where the bottom bar takes over. */
export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-(--spacing-sidebar) shrink-0 flex-col border-r bg-sidebar safe-top text-sidebar-foreground lg:sticky lg:top-0 lg:flex lg:h-dvh">
      <div className="flex h-14 items-center px-4">
        <Link href="/painel" aria-label="Ir para o painel">
          <Logo />
        </Link>
      </div>

      <nav aria-label="Navegação principal" className="flex-1 px-2 py-2">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isNavItemActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
