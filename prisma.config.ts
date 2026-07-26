import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// The Prisma CLI runs outside Next.js, which is what normally loads .env.local.
loadEnv({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations use a direct connection: the runtime URL caps Prisma at one
    // connection, which stalls multi-statement DDL.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
