import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { listChats, listMessages, ensureDemoProfiles } from "@/lib/storage"

export const dynamic = "force-dynamic"

// Drive yedek: tüm sohbetleri + kod dosyalarını JSON olarak döndür
export async function GET() {
  await ensureDemoProfiles()
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })
  const chats = await listChats(user.id)
  const withMessages = await Promise.all(chats.map(async c => ({
    chat: c,
    messages: await listMessages(c.id)
  })))
  // kod dosyaları da getir (per-user)
  let codeFiles: any[] = []
  try {
    // basit file store'dan oku (POST ile yazılanlar)
    const g: any = globalThis as any
    const map: Map<string, any> = g.__sucuk_drive_files || new Map()
    codeFiles = Array.from(map.values()).filter((f:any)=> f.userId === user.id)
  } catch {}
  const backup = {
    exportedAt: new Date().toISOString(),
    user: user.username,
    userId: user.id,
    chats: withMessages,
    codeFiles,
  }
  return NextResponse.json({ ok: true, backup })
}

export async function POST(req: Request) {
  await ensureDemoProfiles()
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })
  const body = await req.json().catch(() => ({})) as any

  // Kod editörü agent modu: filename+content gelirse Drive'a kalıcı kaydet (per-user izole)
  if (body.filename && body.content) {
    const filename = String(body.filename).slice(0,120)
    const content = String(body.content)
    const language = body.language || "tsx"
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      userId: user.id,
      username: user.username,
      filename,
      language,
      content: content.slice(0, 200000),
      prompt: body.prompt || "",
      createdAt: new Date().toISOString(),
      size: content.length,
    }
    // local in-memory per-user store (kalıcı değil ama preview için anında)
    try {
      const g: any = globalThis as any
      if (!g.__sucuk_drive_files) g.__sucuk_drive_files = new Map()
      g.__sucuk_drive_files.set(entry.id, entry)
      // dosya sistemine de yaz (Vercel ephemeral ama demo store gibi)
      try {
        const fs = await import("fs")
        const path = "/tmp/sucuk-drive-" + user.id + ".json"
        let arr: any[] = []
        try { arr = JSON.parse(fs.readFileSync(path, "utf8")) } catch {}
        arr.unshift(entry)
        arr = arr.slice(0, 100) // limit 100 dosya per user
        fs.writeFileSync(path, JSON.stringify(arr))
      } catch {}
    } catch {}

    // Gerçek Google Drive'a push dene (per-user token ile)
    let driveUrl: string | null = null
    let driveError: string | null = null
    try {
      const { listTools } = await import("@/lib/storage")
      const tools = await listTools()
      const userDrives = tools.filter((t:any) => ((t.config as any)?.provider === "google_drive" || (t.config as any)?.provider === "google_workspace") && t.addedBy === user.id)
      const realDrive = [...userDrives].reverse().find((t:any) => (t.config as any)?.accessToken && (t.config as any)?.real)
      if (realDrive) {
        const token = (realDrive.config as any).accessToken
        // multipart upload
        const boundary = "sucuk" + Date.now()
        const metadata = { name: filename, mimeType: "text/plain" }
        const multipartBody = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: text/plain\r\n\r\n${content}\r\n--${boundary}--`
        const r = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": `multipart/related; boundary=${boundary}` },
          body: multipartBody,
        })
        if (r.ok) {
          const j: any = await r.json()
          driveUrl = j.webViewLink || `https://drive.google.com/file/d/${j.id}/view`
        } else {
          driveError = await r.text().then(t=>t.slice(0,300)).catch(()=> r.statusText)
        }
      }
    } catch (e:any) {
      driveError = e.message
    }

    return NextResponse.json({
      ok: true,
      message: driveUrl ? "Drive'a kaydedildi — ön izlemede izle" : "Yerel yedeğe kaydedildi — Drive bağlı değilse /workspace → Drive Bağla",
      driveUrl,
      driveError,
      file: entry,
      persisted: true,
    })
  }

  // Eski davranış: tüm sohbetleri yedekle
  return NextResponse.json({ ok: true, message: "Drive yedek endpoint hazır — frontend Google Drive API ile yükleyecek", received: body })
}
