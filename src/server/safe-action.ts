import "server-only";

import {
  createSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE,
} from "next-safe-action";

import { env } from "@/lib/env";
import { requireSession } from "@/server/session";

/**
 * Base client. Server errors are logged but never forwarded to the browser —
 * a stack trace or a Prisma message is an information leak.
 */
export const actionClient = createSafeActionClient({
  handleServerError(error) {
    if (env.NODE_ENV !== "production") {
      console.error("[action]", error);
    }
    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
});

/**
 * Every mutation on user-owned data goes through this client, so `ctx.userId`
 * is always present and always the authenticated user.
 */
export const authActionClient = actionClient.use(async ({ next }) => {
  const session = await requireSession();
  return next({ ctx: { userId: session.user.id, user: session.user } });
});
