import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { requireSession } from "@/server/session";

/**
 * The authenticated shell: sidebar on desktop, tab bar on mobile.
 * `requireSession()` here is the authoritative guard — the middleware redirect
 * is only an optimisation.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="flex min-h-dvh">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar
          name={session.user.name}
          email={session.user.email}
          image={session.user.image ?? null}
        />

        {/*
          Content width belongs to the shell, except where a screen genuinely
          needs the whole viewport — the editor puts a full A4 sheet next to the
          form. Such a screen marks itself `data-layout="wide"` rather than the
          shell keeping a list of routes that are special.
        */}
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 safe-x has-[[data-layout=wide]]:max-w-[100rem] sm:py-8">
          {children}
        </main>

        {/* Clears the fixed tab bar so content is never trapped behind it. */}
        <div className="h-safe-bottom-nav lg:hidden" aria-hidden />
      </div>

      <BottomNav />
    </div>
  );
}
