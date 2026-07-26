import { env } from "@/lib/env";

/** Single source of truth for product naming and public URLs. */
export const site = {
  name: "CV UP",
  shortName: "CV UP",
  tagline: "Currículos profissionais, sem esforço",
  description:
    "Plataforma profissional para criar, revisar e gerenciar currículos e clientes em um só lugar.",
  locale: "pt-BR",
  url: env.NEXT_PUBLIC_APP_URL,
  themeColor: {
    light: "#ffffff",
    dark: "#0c0e13",
  },
  brandColor: "#4062e0",
} as const;
