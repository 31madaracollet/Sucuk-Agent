import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { bulkRestoreMessages, ensureDemoProfiles } from "@/lib/storage"

export const dynamic = "force-dynamic"

export async function POST(req: Request, { params }: { params: { chatId: string } }) {
  await ensureDemoProfiles()
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })
  try {
    const body = await req.json()
    const { messages } = body as { messages?: any[] }
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages gerekli" }, { status: 400 })
    }
    // güvenlik: max 100 mesaj, her biri max 8000 char, sadece bu sohbet için
    if (messages.length > 100) return NextResponse.json({ error: "Çok fazla mesaj" }, { status: 400 })
    const added = await bulkRestoreMessages(params.chatId, user.id, messages)
    return NextResponse.json({ ok: true, added })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
