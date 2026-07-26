import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Shown inside the app shell when a record does not exist — or belongs to
 * someone else, which is deliberately indistinguishable.
 */
export default function AppNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FileQuestion className="size-5" aria-hidden />
      </span>
      <div>
        <h1 className="text-lg font-semibold tracking-tight">
          Não encontramos esta página
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          O item pode ter sido removido ou o endereço está incorreto.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/painel">Voltar ao painel</Link>
      </Button>
    </div>
  );
}
