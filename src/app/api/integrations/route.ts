import { NextResponse } from "next/server"
import { getCurrentUser, isAdmin } from "@/lib/auth"
import { listTools, addTool, removeTool, ensureDemoProfiles } from "@/lib/storage"

export const dynamic = "force-dynamic"

// integrations are stored as dynamic_tools with config.provider field
const PROVIDERS = ["supabase","github","google_drive","terabox","workspace","excel","notion","vercel","slack","discord"] as const

export async function GET() {
  await ensureDemoProfiles()
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })
  const tools = await listTools()
  // map to integrations view
  return NextResponse.json({ integrations: tools, providers: PROVIDERS })
}

export async function POST(req: Request) {
  await ensureDemoProfiles()
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })
  const body = await req.json()
  const { provider, name, config } = body as { provider?: string; name?: string; config?: any }
  if (!provider || !name) return NextResponse.json({ error: "provider ve name gerekli" }, { status: 400 })
  if (!PROVIDERS.includes(provider as any) && provider.length < 2) return NextResponse.json({ error: "geçersiz provider" }, { status: 400 })
  const tool = await addTool(name, `${provider} entegrasyonu`, { provider, ...config }, user.id)
  return NextResponse.json({ ok: true, integration: tool }, { status: 201 })
}

export async function DELETE(req: Request) {
  await ensureDemoProfiles()
  const user = getCurrentUser()
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "Yetki yok" }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 })
  await removeTool(id)
  return NextResponse.json({ ok: true })
}
