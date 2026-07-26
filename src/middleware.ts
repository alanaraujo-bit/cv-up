import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic redirect only: it checks that a session cookie is present, never
 * that it is valid. The authoritative check is `requireSession()` in the
 * protected layout — this exists so a signed-out visitor never sees the app
 * shell flash before being bounced.
 *
 * The cookie is read by name instead of through `better-auth/cookies` on
 * purpose: that import pulls `jose` into the Edge bundle, which warns about
 * unsupported Node APIs.
 */
const SESSION_COOKIES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

export function middleware(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));

  if (hasSession) return NextResponse.next();

  const signIn = new URL("/entrar", request.url);
  signIn.searchParams.set("proximo", request.nextUrl.pathname);
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: ["/painel/:path*", "/configuracoes/:path*"],
};
