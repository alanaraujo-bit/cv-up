import "server-only";

import { env } from "@/lib/env";

/**
 * Google sign-in is only offered when both credentials are configured.
 *
 * This lives behind `server-only` rather than in `@/lib/env` on purpose: it
 * reads server variables at module scope, and `@/lib/env` is also imported by
 * the browser bundle through the auth client. Evaluating it there throws.
 */
export const isGoogleAuthEnabled = Boolean(
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET,
);
