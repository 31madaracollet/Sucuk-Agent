import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { addTool } from "@/lib/storage"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const error = url.searchParams.get("error")
  if (error) return NextResponse.redirect(new URL(`/workspace?error=google_${encodeURIComponent(error)}`, url.origin))
  if (!code || !state) return NextResponse.json({ error: "code/state eksik" }, { status: 400 })

  const user = getCurrentUser()
  if (!user) return NextResponse.redirect(new URL("/login", url.origin))

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return NextResponse.json({ error: "GOOGLE_CLIENT_SECRET eksik — Vercel env ekleyin" }, { status: 500 })

  try {
    const stateData = JSON.parse(Buffer.from(state, "base64url").toString("utf8"))
    if (stateData.uid !== user.id) throw new Error("state uid uyuşmadı")

    const redirectUri = `${url.origin}/api/auth/google/callback`
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })
    const tokenJson: any = await tokenRes.json()
    if (!tokenRes.ok || tokenJson.error || !tokenJson.access_token) {
      throw new Error(tokenJson.error_description || tokenJson.error || "token alınamadı")
    }

    // userinfo
    const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    })
    const info: any = await infoRes.json().catch(() => ({}))

    // ÖNCE eski aynı-provider bağını temizle — per-user tek bağlı kalsın
    try {
      const { listTools, removeTool } = await import("@/lib/storage")
      const all = await listTools()
      const targetProvider = stateData.type === "agenda" ? "google_workspace" : stateData.type === "drive" ? "google_drive" : "google_workspace"
      for (const t of all.filter(x=> x.addedBy===user.id && (x.config as any)?.provider===targetProvider)) {
        await removeTool(t.id)
      }
    } catch {}
    const tool = await addTool(
      `Google — ${info.email || user.username} (${stateData.type || "all"})`,
      `Gerçek Google bağlantısı — ${info.email || ""} • Drive + Takvim — ${user.username} hesabına kalıcı`,
      {
        provider: stateData.type === "agenda" ? "google_workspace" : stateData.type === "drive" ? "google_drive" : "google_workspace",
        real: true,
        email: info.email,
        googleId: info.id,
        accessToken: tokenJson.access_token,
        refreshToken: tokenJson.refresh_token,
        scope: tokenJson.scope,
        connectedAt: new Date().toISOString(),
        boundToSiteUser: user.id,
        boundToUsername: user.username,
      },
      user.id
    )

    return NextResponse.redirect(new URL(`/workspace?connected=google&email=${encodeURIComponent(info.email || "")}`, url.origin))
  } catch (e: any) {
    console.error("google callback err", e)
    return NextResponse.json({ error: "Google bağlanamadı: " + (e?.message || String(e)) }, { status: 500 })
  }
}
