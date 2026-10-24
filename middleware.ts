import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
  // Edge'de Node crypto yok, basit varlık kontrolü + payload decode
  let user = null
  try {
    const token = req.cookies.get("sucuk_session")?.value
    if (token && token.includes(".")) {
      const [payload] = token.split(".")
      if (payload) {
        try {
          // base64url -> base64
          const b64 = payload.replace(/-/g,"+").replace(/_/g,"/")
          const json = atob(b64)
          const data = JSON.parse(json)
          if (data.u && data.r) user = { id: data.id || `dyn-${data.u}`, username: data.u, role: data.r }
        } catch {}
      }
    }
  } catch {}

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
