/* ------------------------------------------------------------------ */
/*  Görsel Üretimi - Hugging Face (FLUX schnell) + Pollinations fallback */
/*  HF: schnell 1-4 adımda ~2s, Apache2, Inference Providers en hızlı [2]  */
/*  Pollinations: gen.pollinations.ai (eski image.pollinations.ai deprecated 1033) */
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
  if (status === 401) return `401 — token hatalı. Ham: ${b}`
  if (status === 429) return `429 Kota doldu — huggingface.co/settings/billing. Ham: ${b}`
  return `HF hata (${status}): ${b}`
}

import { sanitizeImagePrompt, getStockImageFallback } from "./prompt-guard"
import { createProviderManager } from "./providers"

// Türkçe → İngilizce çevir (sadece Türkçe ise, timeout 2s)
async function enhanceImagePrompt(raw: string): Promise<string> {
  let en = raw
  const hasTurkish = /[çğıöşüÇĞİÖŞÜ]/.test(raw)
  if (hasTurkish) {
    try {
      const m = createProviderManager()
      const providers = m.availableProviders() as any[]
      const order: Array<{p: any, mod: string}> = [
        {p:"google", mod:"gemini-3.8-flash"},
        {p:"groq", mod:"openai/gpt-oss-20b"},
        {p:"openrouter", mod:"meta-llama/llama-3.3-70b-instruct:free"},
      ].filter(x=> providers.includes(x.p))
      for(const c of order){
        try{
          const controller = new AbortController()
          const t = setTimeout(()=>controller.abort(), 2500)
          const res = await m.chat(c.p, c.mod, [
            {role:"system", content:"Translate Turkish image prompt to English vividly. Output ONLY English prompt."},
            {role:"user", content: raw}
          ], {temperature:0.3, maxTokens: 150})
          clearTimeout(t)
          if(res.text && res.text.length>4){ en=res.text.trim().replace(/^[\"']|[\"']$/g,""); break }
        }catch{}
      }
    } catch {}
  }
  // Stil: photorealistic ama kısa – hızlı token, logo yok
  const styleSuffix = ", photorealistic, ultra detailed, sharp focus, 8k, cinematic, no watermark, no logo, no text"
  if(en.toLowerCase().includes("photorealistic")) return en
  // Türkçe prompt çok uzunsa kısalt (HF timeout engel)
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
  prompt = await enhanceImagePrompt(prompt)
  const guard = sanitizeImagePrompt(prompt.length>600 ? original : prompt)
  if(!guard.allowed) return { ok:false, error: guard.reason || "Prompt reddedildi" }
  if(prompt.length < 10) prompt = guard.prompt
  const token = process.env.HUGGINGFACE_API_TOKEN || process.env.HUGGINGFACE_API_TOKEN_2 || process.env.HUGGINGFACE_API_TOKEN_3

  // Hızlı -> kaliteli sıralama (schnell 4 adım ~2s, dev ~10s)
  const hfCandidates = token
    ? [
        "black-forest-labs/FLUX.1-schnell",          // en hızlı, Apache2, 1-4 step
        "black-forest-labs/FLUX.1-dev",              // kalite yedeği
        "Qwen/Qwen-Image",                           // photorealistic yeni
        "stabilityai/stable-diffusion-3.5-large-turbo", // 4 step hızlı SD
      ]
    : []

  // HF Inference Providers deneme – önce hf-inference, sonra fal-ai (hızlı)
  const hfBases = [
    "https://router.huggingface.co/hf-inference/models",
    "https://router.huggingface.co/fal-ai",
  ]

  let lastErr = ""
  for (const model of hfCandidates) {
    for (const base of hfBases) {
      const url = `${base}/${model}`
      try {
        const res = await fetchWithTimeout(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-Wait-For-Model": "true",
          },
          body: JSON.stringify({ inputs: prompt, parameters: { guidance_scale: model.includes("schnell") ? 0 : 3.5, num_inference_steps: model.includes("schnell") ? 4 : undefined } }),
        }, 13000)

        if (!res.ok) {
          const text = await res.text().catch(() => "")
          lastErr = friendlyHfError(res.status, text) + ` | ${url}`
          if (res.status === 403) { lastErr += " -> fallback"; break }
          if (res.status === 503 && text.includes("loading")) {
            await new Promise(r=>setTimeout(r, 1000))
          }
          continue
        }

        const ct = res.headers.get("content-type") ?? ""
        if (ct.startsWith("image/")) {
          const buf = Buffer.from(await res.arrayBuffer())
          if(buf.length>1000) return { ok: true, buffer: buf, contentType: ct }
        } else {
          const text = await res.text()
          // Bazı providerlar JSON döner: {"image": "base64..."} – handle
          try {
            const j = JSON.parse(text)
            if(j.image){ const b = Buffer.from(j.image, "base64"); return { ok:true, buffer:b, contentType:"image/jpeg" } }
          } catch {}
          lastErr = `Beklenmeyen tip ${ct}: ${text.slice(0,300)} | ${url}`
        }
      } catch (err: any) {
        lastErr = `HF hata: ${err?.name==="AbortError" ? "timeout" : (err?.message || err)} | ${model} @ ${base}`
        continue
      }
    }
    // model denendi, sırada Pollinations denenecek – ama önce diğer HF model denenmesin mi? 1 model yeterli
    // schnell başarılı olursa zaten dönmüştü, değilse diğer model dene
    if(lastErr.includes("403")) break
  }

  // ----- FALLBACK: gen.pollinations.ai (yeni, hızlı, eski 1033/524 yok) -----
  try {
    const encoded = encodeURIComponent(prompt)
    const pollUrls = [
      `https://gen.pollinations.ai/image/${encoded}?model=flux&width=1024&height=1024&nologo=true&private=true&enhance=false`,
      `https://gen.pollinations.ai/image/${encoded}?model=turbo&width=1024&height=1024&nologo=true&private=true`,
    ]
    for (const url of pollUrls) {
      try {
        const res = await fetchWithTimeout(url, { headers: { Accept: "image/*" } }, 15000)
        if (!res.ok) {
          lastErr += ` | Pollinations ${res.status}: ${await res.text().catch(()=> "")} | ${url}`
          continue
        }
        const ct = res.headers.get("content-type") ?? "image/jpeg"
        if (!ct.startsWith("image/")) {
          lastErr += ` | Pollinations tip ${ct} | ${url}`
          continue
        }
        const buf = Buffer.from(await res.arrayBuffer())
        if (buf.length < 1000) { lastErr += ` | Pollinations boş | ${url}`; continue }
        return { ok: true, buffer: buf, contentType: ct }
      } catch (e: any) {
        lastErr += ` | Pollinations ${e?.name==="AbortError" ? "timeout" : e?.message} | ${url}`
        continue
      }
    }
  } catch (e: any) {
    lastErr += ` | Pollinations genel: ${e?.message}`
  }

  // Token bitti — stok görsel fallback
  try {
    const stockUrl = getStockImageFallback(prompt)
    const res = await fetchWithTimeout(stockUrl, { headers: { Accept: "image/*" } }, 8000)
    if (res.ok) {
      const ct = res.headers.get("content-type") ?? "image/jpeg"
      if (ct.startsWith("image/")) {
        const buf = Buffer.from(await res.arrayBuffer())
        if (buf.length > 1000) return { ok: true, buffer: buf, contentType: ct }
      }
    }
  } catch {}

  return { ok: false, error: lastErr.slice(0,1500) || "Tüm görsel modelleri başarısız." }
}
