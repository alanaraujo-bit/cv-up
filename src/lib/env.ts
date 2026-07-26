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
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  emptyStringAsUndefined: true,
  // Container image builds run without secrets available.
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
