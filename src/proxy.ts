/**
 * proxy.ts — Next.js 16 proxy (middleware replacement) for route protection.
 *
 * Exports proxy() and matcher config. Redirects unauthenticated users
 * hitting /portal/* to /login with a callbackUrl parameter.
 * Checks for the Auth.js session-token cookie (regular and __Secure- variant).
 *
 * Used by: Next.js 16 proxy configuration (next.config)
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = ["/portal"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a protected route
  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isProtected) {
    // Auth.js stores the session token in this cookie
    const token =
      request.cookies.get("authjs.session-token")?.value ??
      request.cookies.get("__Secure-authjs.session-token")?.value;

    if (!token) {
      const signInUrl = new URL("/login", request.url);
      signInUrl.searchParams.set(
        "callbackUrl",
        `${pathname}${request.nextUrl.search}`,
      );
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*"],
};
