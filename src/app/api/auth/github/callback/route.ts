import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { addTool } from "@/lib/storage"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const error = url.searchParams.get("error")

  if (error) return NextResponse.redirect(new URL(`/workspace?error=github_${encodeURIComponent(error)}`, url.origin))
  if (!code || !state) return NextResponse.json({ error: "code/state eksik" }, { status: 400 })

  const user = getCurrentUser()
  if (!user) return NextResponse.redirect(new URL("/login", url.origin))

  const clientId = process.env.GITHUB_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "GITHUB_CLIENT_SECRET eksik — Vercel env ekleyin" }, { status: 500 })
  }

  try {
    // state doğrula (basit)
    const stateData = JSON.parse(Buffer.from(state, "base64url").toString("utf8"))
    if (stateData.uid !== user.id) throw new Error("state uid uyuşmadı")

    // code → token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${url.origin}/api/auth/github/callback`,
      }),
    })
    const tokenJson: any = await tokenRes.json()
    if (tokenJson.error || !tokenJson.access_token) {
      throw new Error(tokenJson.error_description || tokenJson.error || "token alınamadı")
    }
    const accessToken: string = tokenJson.access_token

    // kullanıcı bilgisi
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json", "User-Agent": "Sucuk-Agent" },
    })
    const ghUser: any = await userRes.json()

    // token'ı entegrasyon olarak kaydet — gerçek bağlı
    const tool = await addTool(
      `GitHub — ${ghUser.login || user.username}`,
      `Gerçek GitHub bağlantısı — @${ghUser.login} • repo erişimi`,
      {
        provider: "github",
        real: true,
        githubLogin: ghUser.login,
        githubId: ghUser.id,
        accessToken, // dikkat: Vercel'de şifreli saklanmalı, demo için direkt
        connectedAt: new Date().toISOString(),
        scope: tokenJson.scope,
      },
      user.id
    )

    return NextResponse.redirect(new URL(`/workspace?connected=github&user=${encodeURIComponent(ghUser.login)}`, url.origin))
  } catch (e: any) {
    console.error("github callback err", e)
    return NextResponse.json({ error: "GitHub bağlanamadı: " + (e?.message || String(e)) }, { status: 500 })
  }
}
