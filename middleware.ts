import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/upload", "/subjects", "/notices", "/teachers", "/labs", "/profile"];

export function middleware(request: NextRequest) {
  const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "academic-session";
  const session = request.cookies.get(sessionCookieName)?.value;
  const { pathname } = request.nextUrl;

  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/upload/:path*", "/subjects/:path*", "/notices/:path*", "/teachers/:path*", "/labs/:path*", "/profile/:path*"]
};
