import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { listTools, addTool, removeTool } from "@/lib/storage"

export const dynamic = "force-dynamic"

// Seçili repo per-user kalıcı — tıpkı Drive gibi hep o hesaba özel
export async function GET() {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })
  const all = await listTools()
  const sel = all.find(t => (t.config as any)?.provider === "github_selected" && t.addedBy === user.id)
  if (!sel) return NextResponse.json({ ok: true, selected: null, note: "Henüz repo seçilmedi — yandan seç" })
  return NextResponse.json({ ok: true, selected: (sel.config as any)?.repoFullName || (sel.config as any)?.repo, tool: sel })
}

export async function POST(req: Request) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const repoFullName = (body.repoFullName || body.repo || "").trim()
  if (!repoFullName || !repoFullName.includes("/")) return NextResponse.json({ error: "repoFullName gerekli — örn 31madaracollet/Sucuk-Agent" }, { status: 400 })
  const all = await listTools()
  for (const t of all.filter(x => x.addedBy === user.id && (x.config as any)?.provider === "github_selected")) {
    await removeTool(t.id)
  }
  const tool = await addTool(
    `Seçili Repo — ${repoFullName}`,
    `Yandan seçildi — ${user.username} hesabına kalıcı`,
    { provider: "github_selected", repoFullName, repo: repoFullName, boundToSiteUser: user.id, boundToUsername: user.username, selectedAt: new Date().toISOString() },
    user.id
  )
  return NextResponse.json({ ok: true, selected: repoFullName, tool })
}

export async function DELETE() {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })
  const all = await listTools()
  for (const t of all.filter(x => x.addedBy === user.id && (x.config as any)?.provider === "github_selected")) {
    await removeTool(t.id)
  }
  return NextResponse.json({ ok: true, selected: null })
}
