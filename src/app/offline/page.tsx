import type { Metadata } from "next";
import { WifiOff } from "lucide-react";

import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Sem conexão",
};

/** Served by the service worker when a navigation fails while offline. */
export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 safe-x text-center">
      <Logo showWordmark={false} />
      <WifiOff className="size-8 text-muted-foreground" aria-hidden />
      <h1 className="text-xl font-semibold tracking-tight">
        Você está offline
      </h1>
      <p className="max-w-sm text-sm text-pretty text-muted-foreground">
        Reconecte-se à internet para continuar. Suas alterações salvas
        localmente não foram perdidas.
      </p>
    </div>
  );
}
