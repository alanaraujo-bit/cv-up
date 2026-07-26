"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authErrorMessage } from "@/features/auth/messages";
import { signInSchema, type SignInInput } from "@/features/auth/schemas";
import { authClient } from "@/lib/auth-client";

export function SignInForm({ redirectTo }: { redirectTo: Route }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: standardSchemaResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
      callbackURL: redirectTo,
    });

    if (error) {
      toast.error(authErrorMessage(error.code));
      return;
    }

    router.push(redirectTo);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="E-mail" error={errors.email?.message}>
        {(props) => (
          <Input
            {...props}
            {...register("email")}
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="voce@exemplo.com"
            autoFocus
          />
        )}
      </Field>

      <Field label="Senha" error={errors.password?.message}>
        {(props) => (
          <Input
            {...props}
            {...register("password")}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
          />
        )}
      </Field>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? <Loader2 className="animate-spin" /> : null}
        Entrar
      </Button>
    </form>
  );
}
