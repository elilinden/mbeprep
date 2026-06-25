import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { canAccessAdmin } from "./src/auth/roles";
import { isAdminRoute, isAuthenticatedRoute } from "./src/auth/route-policy";

export default async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isAuthenticatedRoute(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? "development-auth-secret-change-me",
    secureCookie: request.nextUrl.protocol === "https:",
    cookieName:
      request.nextUrl.protocol === "https:"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
  });

  if (!token) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute(pathname) && !canAccessAdmin(token.roles)) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/onboarding/:path*",
    "/dashboard/:path*",
    "/plan/:path*",
    "/audio/:path*",
    "/practice/:path*",
    "/review/:path*",
    "/essays/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
