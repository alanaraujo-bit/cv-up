import type { Route } from "next";
import {
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: Route;
  label: string;
  icon: LucideIcon;
  /** Shown in the mobile bottom bar. Keep this to four items. */
  primary?: boolean;
}

/** Single source of truth for the sidebar, the bottom bar and ⌘K. */
export const NAV_ITEMS: NavItem[] = [
  {
    href: "/painel",
    label: "Painel",
    icon: LayoutDashboard,
    primary: true,
  },
  {
    href: "/curriculos",
    label: "Currículos",
    icon: FileText,
    primary: true,
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: Users,
    primary: true,
  },
  {
    href: "/modelos",
    label: "Modelos",
    icon: LayoutTemplate,
    primary: true,
  },
  {
    href: "/configuracoes",
    label: "Configurações",
    icon: Settings,
  },
];

export const BOTTOM_NAV_ITEMS = NAV_ITEMS.filter((item) => item.primary);

/** `/painel` must match exactly or every route would light it up. */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/painel") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
