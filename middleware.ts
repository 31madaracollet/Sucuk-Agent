import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "./src/lib/auth";

/* Korunan sayfalar: giriş gerektirir. */
const protectedPaths = [
  "/dashboard",
  "/chat",
  "/settings",
  "/admin",
  "/friends",
];

/* Kimlik gerektirmeyen API yolları. */
const publicApiPrefixes = ["/api/auth/signin", "/api/auth/me", "/api/auth/signout"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const user = getCurrentUser();

  // API istekleri
  if (pathname.startsWith("/api/")) {
    if (publicApiPrefixes.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }
    if (!user) {
      return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Sayfa istekleri
  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isLogin = pathname === "/login";

  if (!user) {
    if (isLogin) return NextResponse.next();
    if (isProtected) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next(); // landing herkese açık
  }

  // Giriş yapmışsa login sayfasına gelirse dashboard'a yönlendir.
  if (isLogin) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)"],
};
