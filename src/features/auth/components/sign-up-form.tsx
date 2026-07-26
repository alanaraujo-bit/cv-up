"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authErrorMessage } from "@/features/auth/messages";
import { signUpSchema, type SignUpInput } from "@/features/auth/schemas";
import { authClient } from "@/lib/auth-client";

export function SignUpForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: standardSchemaResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      callbackURL: "/painel",
    });

    if (error) {
      toast.error(authErrorMessage(error.code));
      return;
    }

    toast.success("Conta criada. Bem-vinda ao CV UP!");
    router.push("/painel");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Nome" error={errors.name?.message}>
        {(props) => (
          <Input
            {...props}
            {...register("name")}
            autoComplete="name"
            placeholder="Como você quer ser chamada"
            autoFocus
          />
        )}
      </Field>

      <Field label="E-mail" error={errors.email?.message}>
        {(props) => (
          <Input
            {...props}
            {...register("email")}
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="voce@exemplo.com"
          />
        )}
      </Field>

      <Field
        label="Senha"
        error={errors.password?.message}
        hint="Mínimo de 8 caracteres."
      >
        {(props) => (
          <Input
            {...props}
            {...register("password")}
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
          />
        )}
      </Field>

      <Field label="Confirmar senha" error={errors.confirmPassword?.message}>
        {(props) => (
          <Input
            {...props}
            {...register("confirmPassword")}
            type="password"
            autoComplete="new-password"
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
        Criar conta
      </Button>
    </form>
  );
}
