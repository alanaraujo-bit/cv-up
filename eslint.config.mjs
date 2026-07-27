import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/sw.js",
    "public/swe-worker-*.js",
    "src/generated/**",
    "services/*/node_modules/**",
  ]),
  {
    rules: {
      // Unused values are a bug signal, but `_`-prefixed args are deliberate.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      // Every value read from process.env must go through src/lib/env.ts.
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message:
            "Import `env` from '@/lib/env' instead of reading process.env directly.",
        },
      ],
    },
  },
  {
    // Config files, scripts and the seed run outside Next.js, which is what
    // normally loads and validates the environment.
    files: [
      "*.config.{ts,mjs,js}",
      "scripts/**/*.{ts,mjs,js}",
      "prisma/**/*.ts",
      "src/lib/env.ts",
      "src/app/sw.ts",
      // The PDF renderer is a separate deployable; it has no Next.js runtime
      // and therefore no `@/lib/env` to import.
      "services/**/*.mjs",
    ],
    rules: { "no-restricted-properties": "off" },
  },
]);

export default eslintConfig;
