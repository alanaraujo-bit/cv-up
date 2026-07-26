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
    // Config files and scripts run outside the app and need raw env access.
    files: [
      "*.config.{ts,mjs,js}",
      "scripts/**/*.{ts,mjs,js}",
      "src/lib/env.ts",
      "src/app/sw.ts",
    ],
    rules: { "no-restricted-properties": "off" },
  },
]);

export default eslintConfig;
