import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

// Google OAuth — Drive + Calendar (Agenda) + Gmail gerçek bağlama
// Scopes: drive, calendar, userinfo
export async function GET(req: Request) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Önce giriş yapmalısınız." }, { status: 401 })

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({
      error: "Google OAuth kurulu değil. Vercel → Env → GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET ekleyin.",
      hint: "Google Cloud Console → APIs & Services → Credentials → Create OAuth 2.0 Client → Authorized redirect: https://sucuk-agent.vercel.app/api/auth/google/callback",
      scopes: "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email",
      docs: "https://console.cloud.google.com/apis/credentials",
    }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") || "drive" // drive | agenda | all
  const scopesMap: Record<string, string> = {
    drive: "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.email openid",
    agenda: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email openid",
    all: "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email openid",
  }
  const scope = scopesMap[type] || scopesMap.all
  const state = Buffer.from(JSON.stringify({ uid: user.id, type, t: Date.now() })).toString("base64url")
  const redirectUri = `${new URL(req.url).origin}/api/auth/google/callback`
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`

  const res = NextResponse.redirect(url)
  res.cookies.set("google_oauth_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 })
  return res
}
