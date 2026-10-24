import { NextResponse } from "next/server"
import { verifyPassword, createSession, setSessionCookie, ensureDemoProfiles } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    await ensureDemoProfiles()
    const body = await req.json()
    const { username, password } = body as { username?: string; password?: string }

    if (!username || !password) {
      return NextResponse.json({ error: "Kullanıcı adı ve şifre gerekli." }, { status: 400 })
    }

    const user = await verifyPassword(username, password)
    if (!user) {
      return NextResponse.json({ error: "Kullanıcı adı veya şifre hatalı." }, { status: 401 })
    }

    const token = createSession(user)

    const res = NextResponse.json(
      { ok: true, user, message: "Giriş başarılı." },
      { status: 200 }
    )
    // Secure fix: Vercel HTTPS için Secure ekle, Lax yeterli, HttpOnly korumalı
    const isProd = process.env.NODE_ENV === "production"
    res.cookies.set("sucuk_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
    return res
  } catch (err: any) {
    return NextResponse.json(
      { error: "Giriş sırasında hata oluştu: " + (err?.message ?? String(err)) },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Sign-in endpointi. POST ile giriş yapın." })
}
