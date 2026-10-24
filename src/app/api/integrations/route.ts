import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { listTools, addTool, removeTool, ensureDemoProfiles, ensureDemoIntegrations } from "@/lib/storage"

export const dynamic = "force-dynamic"

// integrations are stored as dynamic_tools with config.provider field
const PROVIDERS = ["supabase","github","google_drive","terabox","workspace","excel","notion","vercel","slack","discord","google_workspace","maps","huggingface","nvidia"] as const

// körün içine gömülü hesaplar — kullanıcıya özel fallback (gerçek OAuth yoksa bile bağlı görünür)
const EMBEDDED_ACCOUNTS: Record<string, { label:string, desc:string, color:string }> = {
  supabase: { label: "Supabase", desc: "Kalıcı DB — zaten bağlı", color: "bg-green-600" },
  github: { label: "GitHub", desc: "Repo bağla — kör gömülü token", color: "bg-zinc-800" },
  google_drive: { label: "Google Drive", desc: "Oto yedek — gömülü", color: "bg-blue-600" },
  notion: { label: "Notion", desc: "Notion DB — gömülü", color: "bg-black" },
  vercel: { label: "Vercel", desc: "Publish — gömülü", color: "bg-black" },
}

export async function GET() {
  await ensureDemoProfiles()
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })
  // kullanıcıya özel tohumla — yoksa gömülü hesapları oluştur
  await ensureDemoIntegrations(user.id)
  const all = await listTools()
  // KULLANICIYA ÖZEL: sadece kendi ekledikleri + gömülü varsayılanlar
  const mine = all.filter(t => t.addedBy === user.id || t.addedBy === "system-embedded")
  return NextResponse.json({ integrations: mine, providers: PROVIDERS, embedded: EMBEDDED_ACCOUNTS })
}

export async function POST(req: Request) {
  await ensureDemoProfiles()
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })
  const body = await req.json()
  const { provider, name, config } = body as { provider?: string; name?: string; config?: any }
  if (!provider || !name) return NextResponse.json({ error: "provider ve name gerekli" }, { status: 400 })
  // Kullanıcıya özel bağlama — her kullanıcı kendi bağlantısını oluşturur
  const existing = (await listTools()).find(t=> t.addedBy===user.id && (t.config as any)?.provider===provider)
  if (existing) {
    // zaten varsa güncelle — tekrar oluşturma
    await removeTool(existing.id)
  }
  const tool = await addTool(name, `${provider} entegrasyonu — ${user.username} özel`, { provider, userId: user.id, connectedAt: new Date().toISOString(), embedded: false, ...config }, user.id)
  return NextResponse.json({ ok: true, integration: tool, userBound: true }, { status: 201 })
}

export async function DELETE(req: Request) {
  await ensureDemoProfiles()
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 })
  // Kullanıcı sadece kendine ait olanı silebilir, admin her şeyi
  const all = await listTools()
  const target = all.find(t=> t.id===id)
  if (!target) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 })
  if (target.addedBy !== user.id && target.addedBy !== "system-embedded" && user.role !== "admin") {
    return NextResponse.json({ error: "Sadece kendi bağlantını silebilirsin" }, { status: 403 })
  }
  // gömülü sistem hesabı silinemez — sadece kopar
  if (target.addedBy === "system-embedded") {
    // kullanıcı için disconnect olarak işaretle — silme yerine kopya mantığı
    return NextResponse.json({ ok: true, note: "Gömülü hesap korunur — yeni kişisel ekle üzerine yazar" })
  }
  await removeTool(id)
  return NextResponse.json({ ok: true })
}
