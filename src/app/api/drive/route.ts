import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { listChats, listMessages, ensureDemoProfiles } from "@/lib/storage"

export const dynamic = "force-dynamic"

// Drive yedek: tüm sohbetleri JSON olarak döndür, frontend Google Drive picker ile yükler
export async function GET() {
  await ensureDemoProfiles()
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })
  const chats = await listChats(user.id)
  const withMessages = await Promise.all(chats.map(async c => ({
    chat: c,
    messages: await listMessages(c.id)
  })))
  const backup = {
    exportedAt: new Date().toISOString(),
    user: user.username,
    chats: withMessages,
  }
  return NextResponse.json({ ok: true, backup })
}

export async function POST(req: Request) {
  await ensureDemoProfiles()
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })
  // For now just acknowledge; real Drive upload happens client-side via gapi
  const body = await req.json().catch(() => ({}))
  return NextResponse.json({ ok: true, message: "Drive yedek endpoint hazır — frontend Google Drive API ile yükleyecek", received: body })
}
