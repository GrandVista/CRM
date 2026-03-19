import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOGIN_PATH = "/login";
const DASHBOARD_PATH = "/dashboard";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const token = request.cookies.get("token")?.value ?? null;
  const hasToken = !!token?.trim();

  const isProtectedPath = pathname === DASHBOARD_PATH || pathname.startsWith(`${DASHBOARD_PATH}/`);
  const isLoginPage = pathname === LOGIN_PATH;

  if (isProtectedPath && !hasToken) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  if (isLoginPage && hasToken) {
    return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/login"],
};
