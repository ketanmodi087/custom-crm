import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/core/auth/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const pathname = request.nextUrl.pathname;
  const isAuthenticated = Boolean(request.auth?.user);

  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if ((pathname.startsWith("/dashboard") || pathname.startsWith("/leads")) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = { matcher: ["/login", "/dashboard/:path*", "/leads/:path*"] };
