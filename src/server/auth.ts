import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { env } from "@/lib/env";
import { isGoogleAuthEnabled } from "@/server/auth-config";
import { db } from "@/server/db";

const DAY = 60 * 60 * 24;

export const auth = betterAuth({
  appName: "CV UP",
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.NEXT_PUBLIC_APP_URL,
  database: prismaAdapter(db, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    // Verification e-mail delivery lands with the transactional mailer; until
    // then, blocking sign-in on it would lock the user out of their own app.
    requireEmailVerification: false,
  },

  socialProviders: isGoogleAuthEnabled
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID!,
          clientSecret: env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : {},

  session: {
    expiresIn: 30 * DAY,
    // Sliding window: an active user is never logged out mid-edit.
    updateAge: DAY,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  user: {
    changeEmail: { enabled: true },
    deleteUser: { enabled: false },
  },

  advanced: {
    database: {
      // Let Postgres generate ids via the schema's @default(cuid(2)).
      generateId: false,
    },
  },

  // Must stay last: it writes Set-Cookie headers from server actions.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
export type SessionUser = Session["user"];
