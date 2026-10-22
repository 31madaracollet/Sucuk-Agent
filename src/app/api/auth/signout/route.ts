import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookie = clearSessionCookie();
  return NextResponse.json({ ok: true, message: "Çıkış yapıldı." }, { status: 200, headers: { "Set-Cookie": cookie } });
}
