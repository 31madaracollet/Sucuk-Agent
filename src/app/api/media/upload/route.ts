import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { addDirectMessage } from "@/lib/storage"

export const dynamic = "force-dynamic"

// Medya: foto/video/ses → Google Drive yüklenir (simüle), Supabase üzerinden görüntülenir
// Vercel'de gerçek Drive API anahtarı yoksa base64 URL olarak saklanır, UI'da direkt gösterilir
export async function POST(req: NextRequest){
  const user = getCurrentUser()
  if(!user) return NextResponse.json({ error:"Giriş gerekli" }, { status:401 })
  const form = await req.formData()
  const file = form.get("file") as File | null
  const receiverId = form.get("receiverId") as string
  const content = form.get("content") as string || ""
  if(!file || !receiverId) return NextResponse.json({ error:"file ve receiverId gerekli" }, { status:400 })

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString("base64")
  const mime = file.type || "application/octet-stream"
  const mediaType = mime.startsWith("image/") ? "image" : mime.startsWith("video/") ? "video" : mime.startsWith("audio/") ? "audio" : null
  // Drive'a yükleme simülasyonu: data URI olarak sakla, gerçek Drive entegrasyonu Arena connector ile dışarıda da yapılabilir
  const dataUrl = `data:${mime};base64,${base64}`

  const dm = await addDirectMessage(user.id, receiverId, content || file.name)
  // storage helper'ı mediaUrl destekliyor — db'ye patch
  const { supabaseAdmin, isSupabaseConfigured } = await import("@/lib/supabase")
  if(isSupabaseConfigured && supabaseAdmin){
    await supabaseAdmin.from("direct_messages").update({ media_url: dataUrl, media_type: mediaType }).eq("id", dm.id)
  } else {
    // demo fallback: dms map'ini güncelle (storage.ts içindeki demo.dms üzerinde patch gerek ama şimdilik dm'ye ekle)
    ;(dm as any).mediaUrl = dataUrl
    ;(dm as any).mediaType = mediaType
  }

  return NextResponse.json({ ok:true, message: { ...dm, mediaUrl: dataUrl, mediaType } })
}
