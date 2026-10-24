import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

// GitHub OAuth başlat — gerçek connect (Arena connect gibi)
export async function GET(req: Request) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Önce giriş yapmalısınız." }, { status: 401 })

  const clientId = process.env.GITHUB_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ 
      error: "GitHub OAuth kurulu değil. Vercel → Settings → Environment Variables → GITHUB_CLIENT_ID ve GITHUB_CLIENT_SECRET ekleyin.",
      hint: "GitHub → Settings → Developer settings → OAuth Apps → New OAuth App → Callback: https://sucuk-agent.vercel.app/api/auth/github/callback",
      docs: "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app"
    }, { status: 500 })
  }

  const state = Buffer.from(JSON.stringify({ uid: user.id, t: Date.now() })).toString("base64url")
  const scope = "repo user read:org"
  const redirectUri = `${new URL(req.url).origin}/api/auth/github/callback`
  const url = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}`

  const res = NextResponse.redirect(url)
  // state'i kısa süreli cookie'de tut
  res.cookies.set("gh_oauth_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 })
  return res
}
