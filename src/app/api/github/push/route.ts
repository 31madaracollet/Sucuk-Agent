import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getGithubToken, pushFileToRepo, parseRepoUrl } from "@/lib/github"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Önce giriş yapmalısınız." }, { status: 401 })
  const body:any = await req.json().catch(()=> ({}))
  const { repoUrl, path, content, message, branch } = body
  if (!path || !content) return NextResponse.json({ error: "path ve content gerekli" }, { status: 400 })
  const token = await getGithubToken(user.id)
  if (!token) return NextResponse.json({ error: "GitHub bağlı değil — /workspace → GitHub Bağla, veya Vercel GITHUB_TOKEN ayarla", hint: "/api/auth/github" }, { status: 400 })
  let ownerRepo = repoUrl ? parseRepoUrl(repoUrl) : null
  // fallback: token owner
  if (!ownerRepo) {
    try {
      const me = await fetch("https://api.github.com/user", { headers: { Authorization: `Bearer ${token}`, "User-Agent": "Sucuk-Agent" } }).then(r=>r.json()) as any
      ownerRepo = { owner: me.login, repo: body.repo || "sucuk-agent-test" }
    } catch {
      return NextResponse.json({ error: "repoUrl gerekli — örn https://github.com/owner/repo" }, { status: 400 })
    }
  }
  try {
    const j = await pushFileToRepo({ token, owner: ownerRepo.owner, repo: ownerRepo.repo, path, content, message: message || `Sucuk-Agent: ${path}`, branch })
    return NextResponse.json({ ok:true, pushed: j, url: j.content?.html_url })
  } catch(e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok:true, tip: "POST { repoUrl, path, content, message? } ile dosyayı repoya push et. OAuth /api/auth/github ile bağla." })
}
