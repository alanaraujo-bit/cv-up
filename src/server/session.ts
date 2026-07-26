import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth, type Session } from "@/server/auth";

/**
 * Cached per request: a page, its layout and its server actions all read the
 * session without hitting the database more than once.
 */
export const getSession = cache(async (): Promise<Session | null> =>
  auth.api.getSession({ headers: await headers() }),
);

/** Use in every page and action behind the app shell. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/entrar");
  return session;
}

export async function requireUserId(): Promise<string> {
  const session = await requireSession();
  return session.user.id;
}

/** Keeps signed-in users out of the sign-in and sign-up screens. */
export async function requireGuest(): Promise<void> {
  const session = await getSession();
  if (session) redirect("/painel");
}
