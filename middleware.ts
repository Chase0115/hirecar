import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "admin_session";

/**
 * Middleware to protect /admin/* routes.
 * Allows unauthenticated access to /admin/login only.
 * Redirects unauthenticated users to /admin/login.
 * Requirements: 8.1, 8.2
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the login page through without auth
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const session = request.cookies.get(COOKIE_NAME);

  if (!session || session.value !== "authenticated") {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
