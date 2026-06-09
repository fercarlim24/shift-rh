import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseSessionValueEdge } from "@/lib/auth/session-cookie-edge";
import { canAccessAppRoute } from "@/lib/rbac";
import { SESSION_COOKIE } from "@/lib/auth/session-constants";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login" || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) {
    return NextResponse.next();
  }

  const session = await parseSessionValueEdge(raw);
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const res = NextResponse.redirect(url);
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  if (!canAccessAppRoute(session.user.role, pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.set("error", "forbidden");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
