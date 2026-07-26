import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Validated environment access. Import `env` instead of touching
 * `process.env` directly so a missing variable fails the build rather than a
 * request in production.
 */
export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    /** Pooled connection used at runtime. */
    DATABASE_URL: z.url(),
    /** Direct connection used by migrations and the seed. */
    DIRECT_URL: z.url().optional(),

    /** Signing secret for Better Auth sessions. */
    BETTER_AUTH_SECRET: z.string().min(32),

    /** Optional — Google sign-in stays disabled until both are present. */
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  emptyStringAsUndefined: true,
  // Container image builds run without secrets available.
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
