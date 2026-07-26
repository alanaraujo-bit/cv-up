"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Renders nothing unless the browser actually offers installation, so the UI
 * never shows an action that cannot run.
 */
export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setEvent(null);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!event) return null;

  return (
    <Button
      size="lg"
      onClick={async () => {
        await event.prompt();
        setEvent(null);
      }}
    >
      <Download data-icon="inline-start" />
      Instalar aplicativo
    </Button>
  );
}
