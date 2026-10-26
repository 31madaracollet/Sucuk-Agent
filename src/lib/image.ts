/* ------------------------------------------------------------------ */
/*  Görsel Üretimi - FLUX.1-schnell direkt (STOK YOK)                 */
/*  HF 5 token + Pollinations birden paralel, tane tane değil         */
/*  Kota bitince öbür key'e oto geç, stok bozduğu için kaldırıldı       */
/* ------------------------------------------------------------------ */

export interface ImageResult {
  ok: boolean
  buffer?: Buffer
  contentType?: string
  error?: string
}

function friendlyHfError(status: number, body: string): string {
  const b = body.slice(0, 800)
  if (status === 403 && (b.includes("sufficient permissions") || b.includes("Inference Providers"))) {
    return `❌ HF token yetkisiz (403). Fine-grained token → Inference Providers aç. Ham: ${b}`
  }
  if (status === 410 && b.includes("deprecated")) {
    return `410 Gone — model hf-inference'te yok. Ham: ${b}`
  }
  if (status === 401) return `401 — token hatalı/eksik. Vercel → HUGGINGFACE_API_TOKEN ekle. Ham: ${b}`
  if (status === 429) return `429 Kota doldu — huggingface.co/settings/billing. Ham: ${b}`
  if (status === 400 && b.includes("not supported by provider")) {
    return `400 — model/provider uyumsuz (fal-ai desteklemiyor). Ham: ${b}`
  }
  return `HF hata (${status}): ${b}`
}

import { sanitizeImagePrompt, getStockImageFallback, isHumanPrompt } from "./prompt-guard"
import { createProviderManager } from "./providers"

// Çeviri AI → İngilizce (resim modeli hep İngilizce anlıyor, her prompt çevir)
async function enhanceImagePrompt(raw: string): Promise<string> {
  // Kullanıcı "Table" Çiz gibi tırnaklı yazınca temizle
  let cleaned = raw.trim()
    .replace(/^["'“”]+|["'“”]+$/g, "") // baştaki/sondaki tırnakları at
    .replace(/\s+/g, " ")
  if (cleaned.length < 2) cleaned = raw.trim()
  let en = cleaned
  // hız: çeviri sadece gerekirse, paralel race 1.1s
  if (cleaned.length > 12) {
    const nonAscii = (cleaned.match(/[^\x00-\x7F]/g) || []).length
    if (nonAscii / cleaned.length >= 0.15) {
      try {
        const m = createProviderManager()
        const providers = m.availableProviders() as any[]
        const order: Array<{p: any, mod: string}> = [
          {p:"groq", mod:"openai/gpt-oss-20b"},
          {p:"google", mod:"gemini-3.8-flash"},
        ].filter(x=> providers.includes(x.p))
        if (order.length) {
          const races = order.map(c =>
            m.chat(c.p, c.mod, [
              {role:"system", content:"Translate to vivid English for FLUX image model. Output ONLY English prompt."},
              {role:"user", content: cleaned}
            ], {temperature:0.3, maxTokens: 80}).then(r=>r.text).catch(()=>null)
          )
          const timeout = new Promise<null>(res=> setTimeout(()=>res(null), 1100))
          const winner = await Promise.race([...races, timeout]) as string|null
          if (winner && winner.length>4) en = winner.trim().replace(/^["'\u201c\u201d]+|["'\u201c\u201d]+$/g, "").replace(/\s+/g, " ")
        }
      } catch {}
    } else {
      en = cleaned
    }
  }
  // Harf yazmadan direkt görsel: no text/letters/words kesin
  const styleSuffix = ", photorealistic, ultra detailed, sharp focus, 8k, cinematic, clean image, no text, no letters, no words, no typography, no writing, no captions, no labels, no watermark, no logo, no signature"
  if(en.toLowerCase().includes("photorealistic")) {
    // zaten photorealistic varsa da no-text ekle (harfleri tek tek yazmasın)
    if(!en.toLowerCase().includes("no text")) en += ", no text, no letters, no words, no typography, no watermark, no logo"
    return en
  }
  if(en.length>400) en=en.slice(0,400)
  return en + styleSuffix
}

async function fetchWithTimeout(url: string, init: RequestInit, ms=12000): Promise<Response> {
  const ac = new AbortController()
  const t = setTimeout(()=> ac.abort(), ms)
  try {
    const r = await fetch(url, { ...init, signal: ac.signal })
    return r
  } finally { clearTimeout(t) }
}

export async function generateImage(prompt: string): Promise<ImageResult> {
  const original = prompt
  // Stok kaldırıldı — direkt HF'e git, birden paralel
  prompt = await enhanceImagePrompt(prompt)
  const guard = sanitizeImagePrompt(prompt.length>600 ? original : prompt)
  if(!guard.allowed) return { ok:false, error: guard.reason || "Prompt reddedildi" }
  if(prompt.length < 10) prompt = guard.prompt
  // Tüm HF tokenlerini dene
  const tokens: string[] = [
    process.env.HUGGINGFACE_API_TOKEN,
    process.env.HUGGINGFACE_API_TOKEN_2,
    process.env.HUGGINGFACE_API_TOKEN_3,
    process.env.HUGGINGFACE_API_TOKEN_4,
    process.env.HUGGINGFACE_API_TOKEN_5,
  ].filter(Boolean) as string[]
  const token = tokens[0] || ""

  // Tek model, tek key gibi davran ama kota bitince diğer 4 key'e geç — FLUX.1-schnell (hf-inference'te canlı, logosuz, hızlı)
  const hfCandidates: Array<{model:string, bases:string[], steps?:number, guidance?:number}> = token
    ? [
        { model: "black-forest-labs/FLUX.1-schnell", bases: ["https://api-inference.huggingface.co/models", "https://router.huggingface.co/hf-inference/models"], steps: 4, guidance: 0 },
      ]
    : []

  let lastErr = ""

  // ----- Pollinations birden paralel — kota bitince öbür key'e, key yoksa free de birden -----
  const pollTokens: string[] = [
    process.env.POLLINATIONS_API_KEY,
    (process.env as any).POLLINATIONS_API_KEY_2,
    (process.env as any).POLLINATIONS_API_KEY_3,
  ].filter(Boolean) as string[]
  {
    const enc = encodeURIComponent(prompt.replace(/^["']|["']$/g,"").slice(0,400))
    const pollJobs: Promise<Buffer|null>[] = []
    const pollEncs = ["flux","turbo"]
    // key'li birden
    for (const tk of pollTokens) for (const pm of pollEncs) pollJobs.push((async()=>{
      try{ const url=`https://gen.pollinations.ai/image/${enc}?model=${pm}&width=1024&height=1024&nologo=true&private=true&enhance=false`
        const r=await fetchWithTimeout(url,{headers:{Accept:"image/*",Authorization:`Bearer ${tk}`}},15000)
        if(!r.ok){ lastErr+=` | Pollinations ${pm} ${r.status}`; return null }
        const ct=r.headers.get("content-type")||""; if(!ct.startsWith("image/")) return null
        const b=Buffer.from(await r.arrayBuffer()); return b.length>1000?b:null
      }catch(e:any){ lastErr+=` | Pollinations ${pm} ${e?.message}`; return null }
    })())
    // free de birden
    for (const pm of pollEncs) pollJobs.push((async()=>{
      try{ const url=`https://image.pollinations.ai/p/${enc}?model=${pm}&width=1024&height=1024&nologo=true&enhance=false`
        const r=await fetchWithTimeout(url,{headers:{Accept:"image/*"}},12000)
        if(!r.ok) return null
        const b=Buffer.from(await r.arrayBuffer()); return b.length>1000?b:null
      }catch{ return null }
    })())
    if (pollJobs.length){
      const pr = await Promise.allSettled(pollJobs)
      for(const r of pr) if(r.status==="fulfilled" && r.value) return { ok:true, buffer:r.value, contentType:"image/jpeg" }
    }
  }

  // BİRDEN paralel — 5 HF token x 2 endpoint tane tane değil, hepsi aynı anda
  async function tryHfOne(cand: typeof hfCandidates[number], base: string, tk: string, idx: number): Promise<Buffer|null> {
    const url = `${base}/${cand.model}`
    try {
      const res = await fetchWithTimeout(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${tk}`, "Content-Type": "application/json", "X-Wait-For-Model": "true" },
        body: JSON.stringify({ inputs: prompt, parameters: { guidance_scale: cand.guidance ?? 3.5, num_inference_steps: cand.steps } }),
      }, 15000)
      if (!res.ok) {
        const t = await res.text().catch(()=> "")
        lastErr = friendlyHfError(res.status, t) + ` | ${url} [key#${idx+1}]`
        return null
      }
      const ct = res.headers.get("content-type") ?? ""
      if (ct.startsWith("image/")) {
        const buf = Buffer.from(await res.arrayBuffer())
        if (buf.length > 1000) return buf
      } else {
        const t = await res.text()
        try { const j = JSON.parse(t); if (j.image) { const b = Buffer.from(j.image,"base64"); if(b.length>1000) return b } } catch {}
      }
    } catch(e:any){ lastErr = `HF hata: ${e?.name==="AbortError"?"timeout 15s":e?.message} | ${cand.model} [key#${idx+1}]` }
    return null
  }
  if (hfCandidates.length && tokens.length) {
    const all: Promise<Buffer|null>[] = []
    for (const cand of hfCandidates) for (const base of cand.bases) tokens.forEach((tk,i)=> all.push(tryHfOne(cand,base,tk,i)))
    const settled = await Promise.allSettled(all)
    for (const r of settled) if (r.status==="fulfilled" && r.value) return { ok:true, buffer:r.value, contentType:"image/jpeg" }
  }

  // Stok kaldırıldı (bozuyor) — sadece HF + Pollinations birden

  const hint = !token ? "HF token yok. Vercel → HUGGINGFACE_API_TOKEN ekleyin. " : ""
  return { ok: false, error: (hint + lastErr).slice(0,1500) || "Tüm görsel modelleri başarısız (stok kaldırıldı)." }
}
