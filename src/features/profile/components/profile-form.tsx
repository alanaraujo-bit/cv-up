"use client";

import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useAction } from "next-safe-action/hooks";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfileAction } from "@/features/profile/actions";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/features/profile/schemas";
import type { ProfileView } from "@/features/profile/service";

export function ProfileForm({ profile }: { profile: ProfileView }) {
  const { execute, isPending } = useAction(updateProfileAction, {
    onSuccess: ({ data }) => toast.success(data?.message ?? "Perfil salvo."),
    onError: ({ error }) =>
      toast.error(error.serverError ?? "Não foi possível salvar."),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<UpdateProfileInput>({
    resolver: standardSchemaResolver(updateProfileSchema),
    defaultValues: {
      name: profile.name,
      displayName: profile.displayName ?? "",
      headline: profile.headline ?? "",
      city: profile.city ?? "",
      phone: profile.phone ?? "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    execute(values);
    // Keep the submitted values as the new baseline so the button settles.
    reset(values, { keepValues: true });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Nome" error={errors.name?.message}>
        {(props) => (
          <Input {...props} {...register("name")} autoComplete="name" />
        )}
      </Field>

      <Field
        label="Nome de exibição"
        optional
        error={errors.displayName?.message}
        hint="Como você aparece no aplicativo. Deixe vazio para usar seu nome."
      >
        {(props) => <Input {...props} {...register("displayName")} />}
      </Field>

      <Field
        label="Título profissional"
        optional
        error={errors.headline?.message}
        hint="Ex.: Especialista em currículos e recolocação."
      >
        {(props) => <Input {...props} {...register("headline")} />}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cidade" optional error={errors.city?.message}>
          {(props) => (
            <Input
              {...props}
              {...register("city")}
              autoComplete="address-level2"
            />
          )}
        </Field>

        <Field label="Telefone" optional error={errors.phone?.message}>
          {(props) => (
            <Input
              {...props}
              {...register("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(11) 99999-0000"
            />
          )}
        </Field>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isPending || !isDirty}>
          {isPending ? <Loader2 className="animate-spin" /> : null}
          Salvar alterações
        </Button>
      </div>
    </form>
  );
}
