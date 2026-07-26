"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Laptop, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { NAV_ITEMS } from "@/config/navigation";
import { authClient } from "@/lib/auth-client";

const THEMES = [
  { value: "light", label: "Tema claro", icon: Sun },
  { value: "dark", label: "Tema escuro", icon: Moon },
  { value: "system", label: "Tema do sistema", icon: Laptop },
] as const;

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { setTheme } = useTheme();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "k" || !(event.metaKey || event.ctrlKey)) return;
      // Do not steal the browser's own shortcut chords.
      if (event.altKey || event.shiftKey) return;
      event.preventDefault();
      onOpenChange(!open);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const run = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Paleta de comandos"
      description="Busque páginas e execute ações rápidas."
    >
      <CommandInput placeholder="Buscar páginas e ações…" />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>

        <CommandGroup heading="Ir para">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <CommandItem
              key={href}
              value={`ir para ${label}`}
              onSelect={() => run(() => router.push(href))}
            >
              <Icon />
              {label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Aparência">
          {THEMES.map(({ value, label, icon: Icon }) => (
            <CommandItem
              key={value}
              value={label}
              onSelect={() => run(() => setTheme(value))}
            >
              <Icon />
              {label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Conta">
          <CommandItem
            value="sair encerrar sessão logout"
            onSelect={() =>
              run(async () => {
                const { error } = await authClient.signOut();
                if (error) {
                  toast.error("Não foi possível sair. Tente novamente.");
                  return;
                }
                router.push("/entrar");
                router.refresh();
              })
            }
          >
            <LogOut />
            Sair
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
