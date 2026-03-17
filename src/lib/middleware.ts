import { NextRequest, NextResponse } from "next/server";
import { unsealData } from "iron-session";
import { SessionData } from "./session";

const SESSION_COOKIE = "markforge_session";

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/callback") || // ← this is the critical one
    pathname.startsWith("/api/auth/logout") ||
    pathname.startsWith("/share") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/wasm") ||
    pathname.startsWith("/favicon") ||
    /\.(.*)$/.test(pathname)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(SESSION_COOKIE);

  if (!cookie?.value) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { user } = await unsealData<SessionData>(cookie.value, {
      password: process.env.SESSION_SECRET as string,
    });

    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
