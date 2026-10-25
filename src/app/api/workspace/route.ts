import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { listChats, listMessages, ensureDemoProfiles } from "@/lib/storage"
import { webSearch, browseUrl } from "@/lib/search"

export const dynamic = "force-dynamic"

// Workspace: web arama + sayfa çekme + sohbet özetleri + Drive/Depo bir arada
export async function GET(req: Request) {
  await ensureDemoProfiles()
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")
  const url = searchParams.get("url")
  const drive = searchParams.get("drive")
  const storage = searchParams.get("storage")
  if (url) {
    const data = await browseUrl(url)
    return NextResponse.json({ ok: true, browse: data })
  }
  if (q) {
    const results = await webSearch(q, 6)
    return NextResponse.json({ ok: true, results })
  }
  if (drive) {
    const { getDriveContext } = await import("@/lib/drive")
    const ctx:any = await getDriveContext(user.id)
    return NextResponse.json({ ok:true, drive: ctx })
  }
  if (storage) {
    const { getStorageContext } = await import("@/lib/drive")
    const ctx:any = await getStorageContext(user.id)
    return NextResponse.json({ ok:true, storage: ctx })
  }
  // default: son sohbetler özet + araç ipuçları
  const chats = await listChats(user.id)
  const recent = chats.slice(0, 5)
  const summaries = await Promise.all(recent.map(async c => ({
    chat: c,
    messageCount: (await listMessages(c.id)).length
  })))
  return NextResponse.json({ ok: true, recentChats: summaries, tip: "q=arama, url=sayfa, drive=1 → Drive dosyaları, storage=1 → depo özeti, POST /api/github/push ile repoya kod at" })
}

export async function POST(req: Request) {
  const body = await req.json().catch(()=> ({}))
  if (body.url) {
    const data = await browseUrl(body.url)
    return NextResponse.json({ ok: true, browse: data })
  }
  if (body.prompt && body.repo) {
    // kod yaz ve repoya at kısayolu
    const { getGithubToken, pushFileToRepo } = await import("@/lib/github")
    const user = getCurrentUser()
    if (!user) return NextResponse.json({ error:"Oturum açmalısınız"},{status:401})
    const token = await getGithubToken(user.id)
    if (!token) return NextResponse.json({ error:"GitHub bağlı değil"},{status:400})
    const { parseRepoUrl } = await import("@/lib/github")
    const pr = parseRepoUrl(body.repo)
    if (!pr) return NextResponse.json({ error:"repo parse edilemedi"},{status:400})
    const r = await pushFileToRepo({ token, owner: pr.owner, repo: pr.repo, path: body.path || "output.ts", content: body.prompt, message: body.message || "Sucuk-Agent workspace push" })
    return NextResponse.json({ ok:true, pushed: r })
  }
  return NextResponse.json({ error: "url gerekli" }, { status: 400 })
}
