import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { listTools, addTool, removeTool, ensureDemoProfiles, ensureDemoIntegrations } from "@/lib/storage"

export const dynamic = "force-dynamic"

const PROVIDERS = ["supabase","github","google_drive","terabox","workspace","excel","notion","vercel","slack","discord","google_workspace","maps","huggingface","nvidia"] as const

const EMBEDDED_ACCOUNTS: Record<string, { label:string, desc:string, color:string }> = {
  supabase: { label: "Supabase", desc: "Kalıcı DB — zaten bağlı", color: "bg-green-600" },
  github: { label: "GitHub", desc: "Repo bağla — kör gömülü token", color: "bg-zinc-800" },
  google_drive: { label: "Google Drive", desc: "Oto yedek — gömülü", color: "bg-blue-600" },
  notion: { label: "Notion", desc: "Notion DB — gömülü", color: "bg-black" },
  vercel: { label: "Vercel", desc: "Publish — gömülü", color: "bg-black" },
}

export async function GET(req: Request) {
  await ensureDemoProfiles()
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })
  await ensureDemoIntegrations(user.id)
  const all = await listTools()
  // SIKI PER-USER: sadece bu site hesabına ait entegrasyonlar — başka hesaba ait olan asla dönmez, hep öyle kalır
  const mine = all.filter(t => t.addedBy === user.id)
  const system = all.filter(t => t.addedBy === "system-embedded")
  const debug = new URL(req.url).searchParams.get("debug")
  return NextResponse.json({
    integrations: mine,
    providers: PROVIDERS,
    embedded: EMBEDDED_ACCOUNTS,
    systemPlaceholders: system,
    owner: { id: user.id, username: user.username },
    countMine: mine.length,
    note: mine.length ? `Bu ${mine.length} bağlantı ${user.username} (${user.id}) hesabına kalıcı bağlı — başka hesaba geçmez, hep öyle kalır` : "Henüz bu hesaba özel bağlantı yok — workspace'den bağla, kalıcı olur",
    ...(debug ? { debugAll: all.slice(0,20).map(t=> ({id:t.id, name:t.name, provider:(t.config as any)?.provider, addedBy:t.addedBy, real:(t.config as any)?.real})) } : {})
  })
}

export async function POST(req: Request) {
  await ensureDemoProfiles()
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })
  const body = await req.json()
  const { provider, name, config } = body as { provider?: string; name?: string; config?: any }
  if (!provider || !name) return NextResponse.json({ error: "provider ve name gerekli" }, { status: 400 })
  const existing = (await listTools()).find(t=> t.addedBy===user.id && (t.config as any)?.provider===provider)
  if (existing) {
    await removeTool(existing.id)
  }
  const tool = await addTool(name, `${provider} entegrasyonu — ${user.username} özel (kalıcı)`, { provider, userId: user.id, boundToSiteUser: user.id, boundToUsername: user.username, connectedAt: new Date().toISOString(), embedded: false, persistent:true, ...config }, user.id)
  return NextResponse.json({ ok: true, integration: tool, userBound: true, owner: user.username }, { status: 201 })
}

export async function DELETE(req: Request) {
  await ensureDemoProfiles()
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 })
  const all = await listTools()
  const target = all.find(t=> t.id===id)
  if (!target) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 })
  if (target.addedBy !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "Sadece kendi bağlantını silebilirsin — bu başka hesaba ait" }, { status: 403 })
  }
  if (target.addedBy === "system-embedded") {
    return NextResponse.json({ ok: true, note: "Gömülü hesap korunur — yeni kişisel ekle üzerine yazar" })
  }
  await removeTool(id)
  return NextResponse.json({ ok: true })
}
