import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { listChats, listMessages, ensureDemoProfiles } from "@/lib/storage"
import { webSearch, browseUrl } from "@/lib/search"

export const dynamic = "force-dynamic"

// Workspace: web arama + sayfa çekme + sohbet özetleri bir arada
export async function GET(req: Request) {
  await ensureDemoProfiles()
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")
  const url = searchParams.get("url")
  if (url) {
    const data = await browseUrl(url)
    return NextResponse.json({ ok: true, browse: data })
  }
  if (q) {
    const results = await webSearch(q, 6)
    return NextResponse.json({ ok: true, results })
  }
  // default: son sohbetler özet
  const chats = await listChats(user.id)
  const recent = chats.slice(0, 5)
  const summaries = await Promise.all(recent.map(async c => ({
    chat: c,
    messageCount: (await listMessages(c.id)).length
  })))
  return NextResponse.json({ ok: true, recentChats: summaries, tip: "q ile web ara, url ile sayfa çek" })
}

export async function POST(req: Request) {
  // proxy for browseUrl body
  const body = await req.json()
  if (body.url) {
    const data = await browseUrl(body.url)
    return NextResponse.json({ ok: true, browse: data })
  }
  return NextResponse.json({ error: "url gerekli" }, { status: 400 })
}
