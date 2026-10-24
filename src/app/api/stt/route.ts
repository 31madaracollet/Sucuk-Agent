import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

// Groq Whisper STT — speech to text
// POST formData file veya base64 audio
export async function POST(req: NextRequest){
  const user = getCurrentUser()
  if(!user) return NextResponse.json({ error:"Giriş gerekli" }, { status:401 })

  try {
    const form = await req.formData().catch(()=>null)
    let audioFile: File | null = null
    let audioBlob: Blob | null = null
    if(form){
      audioFile = form.get("file") as File || form.get("audio") as File
      if(!audioFile) audioBlob = form.get("blob") as Blob
    }
    // JSON base64 fallback
    if(!audioFile && !audioBlob){
      const body = await req.json().catch(()=>null)
      if(body?.audioBase64){
        const buf = Buffer.from(body.audioBase64.split(",").pop() || body.audioBase64, "base64")
        audioBlob = new Blob([buf], { type: body.mimeType || "audio/webm" })
      }
    }

    const fileToTranscribe = audioFile || audioBlob
    if(!fileToTranscribe) return NextResponse.json({ error:"Ses dosyası yok" }, { status:400 })

    const groqKeys = [process.env.GROQ_API_KEY_1, process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY_3].filter(Boolean) as string[]
    if(groqKeys.length===0) return NextResponse.json({ error:"Groq anahtarı yok (Vercel GROQ_API_KEY_1 ekle)" }, { status:500 })

    // Try each key
    let lastErr = ""
    for(const key of groqKeys){
      try {
        const fd = new FormData()
        const blob = fileToTranscribe as Blob
        // need to append as file with filename
        const filename = (audioFile as File)?.name || `audio-${Date.now()}.webm`
        fd.append("file", blob, filename)
        fd.append("model", "whisper-large-v3")
        // optional language
        fd.append("language", "tr")
        fd.append("response_format", "json")

        const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
          method:"POST",
          headers:{ "Authorization": `Bearer ${key}` },
          body: fd as any
        })
        if(!res.ok){
          const txt = await res.text()
          lastErr = txt
          if(res.status===401 || res.status===429) continue
          // try next key on quota
          if(txt.toLowerCase().includes("quota") || txt.toLowerCase().includes("rate")) continue
          return NextResponse.json({ error: `Groq STT hata: ${res.status} ${txt.slice(0,400)}` }, { status:500 })
        }
        const j = await res.json()
        const text = j.text || j.data?.text || ""
        return NextResponse.json({ ok:true, text, raw: j })
      } catch(e:any){ lastErr = e.message; continue }
    }
    return NextResponse.json({ error: "Tüm Groq anahtarları başarısız: " + lastErr.slice(0,800) }, { status:500 })
  } catch(e:any){
    return NextResponse.json({ error: e.message }, { status:500 })
  }
}

export async function GET(){
  return NextResponse.json({ ok:true, info:"POST formData file -> Groq whisper-large-v3 STT, text döner. Arkadaşına veya Agent'a yazmak için kullan." })
}
