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
  // kod dosyaları da getir (per-user izole + dosya ismi kullanıcı adıyla başlar)
  let codeFiles: any[] = []
  try {
    const g: any = globalThis as any
    const map: Map<string, any> = g.__sucuk_drive_files || new Map()
    const safePrefix = user.username.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0,24)
    codeFiles = Array.from(map.values()).filter((f:any)=> {
      if (f.userId !== user.id) return false
      // sadece bu hesapla başlayan dosya isimlerini al
      if (f.filename && !String(f.filename).startsWith(safePrefix + "-") && !String(f.filename).startsWith(safePrefix + "_") && f.username !== user.username) {
        // eski kayıtlarda uyum için userId zaten filtreler, ama prefix kuralı yeni kayıtlarda geçerli
        // userId eşleşiyorsa göster (geriye uyum)
        return true
      }
      return true
    })
    // dosya sisteminden de per-user oku
    try {
      const fs = await import("fs")
      const path = "/tmp/sucuk-drive-" + user.id + ".json"
      const raw = fs.readFileSync(path, "utf8")
      const arr = JSON.parse(raw)
      // zaten map'te yoksa ekle
      for (const e of arr) {
        if (!codeFiles.find((x:any)=> x.id===e.id)) {
          if (String(e.filename).startsWith(safePrefix) || e.userId===user.id) codeFiles.push(e)
        }
      }
    } catch {}
    // kullanıcı adıyla başlayanları öne al
    codeFiles = codeFiles.filter((f:any)=> String(f.filename).startsWith(safePrefix) || f.userId===user.id).slice(0,100)
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

  // Kod editörü agent modu: filename+content gelirse Drive'a kalıcı kaydet (per-user izole + kullanıcı adıyla)
  if (body.filename && body.content) {
    const rawName = String(body.filename).slice(0,120).trim().replace(/^\//,"")
    const originalContent = String(body.content)
    const language = body.language || "tsx"
    // kullanıcı adı ile prefix: örn. Sucuk9977-agent-output.tsx
    const safeUser = user.username.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0,24)
    let prefixedName = rawName
    if (!rawName.startsWith(safeUser+"-") && !rawName.startsWith(safeUser+"_")) {
      prefixedName = `${safeUser}-${rawName}`
    }
    // veri içine de kullanıcı adını yaz (header yorum)
    let contentWithHeader: string
    const header = `Sucuk-Agent | Hesap: ${user.username} | ID: ${user.id} | Tarih: ${new Date().toISOString()} | Dosya: ${prefixedName}`
    if (language==="html" || prefixedName.endsWith(".html")) {
      contentWithHeader = `<!-- ${header} -->\n` + originalContent
    } else if (language==="css") {
      contentWithHeader = `/* ${header} */\n` + originalContent
    } else if (language==="python" || prefixedName.endsWith(".py")) {
      contentWithHeader = `# ${header}\n` + originalContent
    } else if (language==="sql") {
      contentWithHeader = `-- ${header}\n` + originalContent
    } else {
      contentWithHeader = `// ${header}\n` + originalContent
    }

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      userId: user.id,
      username: user.username,
      filename: prefixedName,
      originalFilename: rawName,
      language,
      content: contentWithHeader.slice(0, 200000),
      rawContent: originalContent.slice(0, 200000),
      prompt: body.prompt || "",
      createdAt: new Date().toISOString(),
      size: contentWithHeader.length,
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

    // Gerçek Google Drive'a push dene (per-user token ile) — isim zaten prefixli
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
        const metadata = { name: prefixedName, mimeType: "text/plain" }
        const multipartBody = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: text/plain\r\n\r\n${contentWithHeader}\r\n--${boundary}--`
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
      message: driveUrl ? `Drive'a kaydedildi (${prefixedName}) — ön izlemede izle` : `Yerel yedeğe kaydedildi (${prefixedName}) — Drive bağlı değilse /workspace → Drive Bağla`,
      driveUrl,
      driveError,
      file: entry,
      persisted: true,
    })
  }

  // Eski davranış: tüm sohbetleri yedekle
  return NextResponse.json({ ok: true, message: "Drive yedek endpoint hazır — frontend Google Drive API ile yükleyecek", received: body })
}
