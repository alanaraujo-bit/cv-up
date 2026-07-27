import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    /*
     * Fixed, obviously fake values so anything importing `@/lib/env` — which
     * validates at module load — is testable without a developer's `.env.local`
     * and behaves identically in CI. Never a real secret: this file is
     * committed.
     */
    env: {
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      BETTER_AUTH_SECRET: "test-secret-not-used-anywhere-real-0123456789",
      BLOB_READ_WRITE_TOKEN: "test-blob-token",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./vitest.server-only.ts"),
    },
  },
});
