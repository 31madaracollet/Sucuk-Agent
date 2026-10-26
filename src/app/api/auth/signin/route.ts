import { NextResponse } from "next/server"
import { verifyPassword, createSession, ensureDemoProfiles } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    await ensureDemoProfiles()
    const body = await req.json()
    const { username, password } = body as { username?: string; password?: string }

    if (!username || !password) {
      return NextResponse.json({ error: "Kullanici adi ve sifre gerekli." }, { status: 400 })
    }

    const user = await verifyPassword(username, password)
    if (!user) {
      return NextResponse.json({ error: "Kullanici adi veya sifre hatali." }, { status: 401 })
    }

    const token = createSession(user)

    const res = NextResponse.json(
      { ok: true, user, token, message: "Giris basarili." },
      { status: 200 }
    )
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
      { error: "Giris sirasinda hata olustu: " + (err?.message ?? String(err)) },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Sign-in endpointi. POST ile giris yapin." })
}
