import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* Korunan sayfalar: per-tab session — her sekme ayri hesap, sekme kapaninca oturum kapanir, ayni IP'de iki sekme iki hesap */
const protectedApiPrefixes = [
  "/api/chat",
  "/api/messages",
  "/api/friends",
  "/api/projects",
  "/api/drive",
  "/api/notifications",
];

/* Kimlik gerektirmeyen API yollari. */
const publicApiPrefixes = ["/api/auth/signin", "/api/auth/me", "/api/auth/signout", "/api/auth/signup"];

function getUserFromHeader(req: NextRequest) {
  try {
    const token =
      req.headers.get("x-sucuk-token") ||
      req.headers.get("x-sucuk-session") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "")
    if (token && token.includes(".")) {
      const [payload] = token.split(".")
      if (payload) {
        let b64 = payload.replace(/-/g,"+").replace(/_/g,"/")
        b64 += "=".repeat((4 - b64.length % 4) % 4)
        const json = atob(b64)
        const data = JSON.parse(json)
        if (data.u && data.r) return { id: data.id || `dyn-${data.u}`, username: data.u, role: data.r }
      }
    }
  } catch {}
  return null
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // API istekleri — per-tab header token kontrolu
  if (pathname.startsWith("/api/")) {
    if (publicApiPrefixes.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }
    // sadece header token gecerli — cookie tek basina yetmez (iki sekme karismasin)
    const user = getUserFromHeader(req)
    // bazi API'ler (announcements, tools) herkese acik olabilir, sadece korumali olanlari kontrol et
    const isProtectedApi = protectedApiPrefixes.some(p => pathname.startsWith(p))
    if (isProtectedApi && !user) {
      return NextResponse.json({ error: "Oturum acmalisiniz." }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Sayfa istekleri — client SessionProvider kontrol edecek
  // her yeni sekme login'e atar, refresh haric (sessionStorage korunur, yeni sekmede bos)
  // burada redirect yapmiyoruz, client tarafi halledecek (sekme kapatinca token silinir)
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)"],
};
