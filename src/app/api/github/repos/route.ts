import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getGithubToken, getGithubContext } from "@/lib/github"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })
  const token = await getGithubToken(user.id)
  const ctx = await getGithubContext(user.id)
  if (!token) {
    return NextResponse.json({ ok: false, connected: false, repos: [], context: ctx, note: "GitHub bağlı değil — /workspace → GitHub Gerçek Bağla (bu hesaba özel, hep kalır)" })
  }
  try {
    const res = await fetch("https://api.github.com/user/repos?per_page=40&sort=updated", {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "Sucuk-Agent" },
      cache: "no-store",
    })
    if (!res.ok) {
      const txt = await res.text()
      return NextResponse.json({ ok: false, connected: true, repos: [], context: ctx, error: `GitHub API ${res.status}: ${txt.slice(0,300)}` }, { status: 200 })
    }
    const repos: any[] = await res.json()
    const cleaned = repos.map((r: any) => ({
      id: r.id,
      full_name: r.full_name,
      name: r.name,
      owner: r.owner?.login,
      private: r.private,
      html_url: r.html_url,
      updated_at: r.updated_at,
      language: r.language,
      description: r.description,
      default_branch: r.default_branch,
    }))
    return NextResponse.json({ ok: true, connected: true, repos: cleaned, context: ctx, count: cleaned.length })
  } catch (e: any) {
    return NextResponse.json({ ok: false, connected: true, repos: [], context: ctx, error: e.message }, { status: 500 })
  }
}
