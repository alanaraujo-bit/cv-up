import type { Metadata } from "next";
import Link from "next/link";

import { GoogleButton } from "@/features/auth/components/google-button";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { safeRedirect } from "@/features/auth/redirect";
import { isGoogleAuthEnabled } from "@/server/auth-config";

export const metadata: Metadata = {
  title: "Entrar",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const redirectTo = safeRedirect((await searchParams).proximo);

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          Entrar na sua conta
        </h1>
        <p className="text-sm text-muted-foreground">
          Continue de onde você parou.
        </p>
      </div>

      <SignInForm redirectTo={redirectTo} />

      {isGoogleAuthEnabled ? (
        <>
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleButton label="Entrar com Google" />
        </>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link
          href="/criar-conta"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Criar conta
        </Link>
      </p>
    </div>
  );
}
