/**
 * Removes accounts created by manual QA runs (anything on @cvup.test), along
 * with the photos their resumes uploaded. Database rows cascade; blobs do not,
 * so they are deleted explicitly rather than left paying rent forever.
 *
 *   pnpm exec tsx scripts/cleanup-test-users.ts
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { del } from "@vercel/blob";
import { config as loadEnv } from "dotenv";

import { PrismaClient } from "../src/generated/prisma/client";

loadEnv({ path: [".env.local", ".env"], quiet: true });

const connectionString =
  process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"];
if (!connectionString) throw new Error("DATABASE_URL is not set");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const users = await db.user.findMany({
    where: { email: { endsWith: "@cvup.test" } },
    select: { id: true, resumes: { select: { content: true } } },
  });

  const token = process.env["BLOB_READ_WRITE_TOKEN"];
  let photos = 0;

  for (const user of users) {
    for (const resume of user.resumes) {
      const content = resume.content as { personal?: { photo?: unknown } };
      const photo = content.personal?.photo as { pathname?: string } | null;
      if (!photo?.pathname || !token) continue;

      try {
        await del(photo.pathname, { token });
        photos += 1;
      } catch {
        // Already gone is the desired end state.
      }
    }
  }

  const { count } = await db.user.deleteMany({
    where: { id: { in: users.map((user) => user.id) } },
  });

  console.log(`cleanup: removed ${count} test users and ${photos} photos`);
  console.log(`cleanup: ${await db.user.count()} users remaining`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => void db.$disconnect());
