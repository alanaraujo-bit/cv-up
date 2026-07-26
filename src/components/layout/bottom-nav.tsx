"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BOTTOM_NAV_ITEMS, isNavItemActive } from "@/config/navigation";
import { cn } from "@/lib/utils";

/**
 * Mobile navigation. Fixed to the bottom like a native tab bar, with the home
 * indicator area padded out via `safe-bottom`.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 safe-x safe-bottom backdrop-blur-md lg:hidden"
    >
      <ul className="flex h-(--spacing-bottom-nav) items-stretch">
        {BOTTOM_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isNavItemActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-[0.65rem] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon
                  className={cn("size-5", active && "stroke-[2.4]")}
                  aria-hidden
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
