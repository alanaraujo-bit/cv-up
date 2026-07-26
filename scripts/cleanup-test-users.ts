/**
 * Removes accounts created by manual QA runs (anything on @cvup.test).
 * Cascades clean up their sessions, resumes and clients.
 *
 *   pnpm exec tsx scripts/cleanup-test-users.ts
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";

import { PrismaClient } from "../src/generated/prisma/client";

loadEnv({ path: [".env.local", ".env"], quiet: true });

const connectionString =
  process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"];
if (!connectionString) throw new Error("DATABASE_URL is not set");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const { count } = await db.user.deleteMany({
    where: { email: { endsWith: "@cvup.test" } },
  });

  console.log(`cleanup: removed ${count} test users`);
  console.log(`cleanup: ${await db.user.count()} users remaining`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => void db.$disconnect());
