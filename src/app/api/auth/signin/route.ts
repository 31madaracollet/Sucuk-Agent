import { NextResponse } from "next/server";
import { verifyPassword, createSession, setSessionCookie, ensureDemoProfiles } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await ensureDemoProfiles();
    const body = await req.json();
    const { username, password } = body as { username?: string; password?: string };

    if (!username || !password) {
      return NextResponse.json({ error: "Kullanıcı adı ve şifre gerekli." }, { status: 400 });
    }

    const user = verifyPassword(username, password);
    if (!user) {
      return NextResponse.json({ error: "Kullanıcı adı veya şifre hatalı." }, { status: 401 });
    }

    const token = createSession(user);
    const cookie = setSessionCookie(token);

    return NextResponse.json(
      { ok: true, user, message: "Giriş başarılı." },
      { status: 200, headers: { "Set-Cookie": cookie } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Giriş sırasında hata oluştu: " + (err?.message ?? String(err)) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Sign-in endpointi. POST ile giriş yapın." });
}
