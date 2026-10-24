/* ------------------------------------------------------------------ */
/*  Görsel Üretimi - Hugging Face + Pollinations fallback             */
/*  HF hf-inference bazı modellerde 410 Gone veriyor (SDXL gibi) [1] */
/*  Bu yüzden: 1) güncel HF modelleri dene, 2) Pollinations beleş fallback */
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
    return `❌ HF token yetkisiz (403). Fine-grained token → Inference > Make calls to Inference Providers aç [1][15]. Ham: ${b}`
  }
  if (status === 410 && b.includes("deprecated")) {
    return `410 Gone — bu model hf-inference'te artık yok [1]. HF sadece CPU modelleri sunuyor (Temmuz 2025), SDXL kaldırıldı. Ham: ${b}`
  }
  if (status === 401) return `401 — token yanlış/süresi dolmuş. Vercel env kontrol et. Ham: ${b}`
  if (status === 429) return `429 Kota doldu — https://huggingface.co/settings/billing bak. Ham: ${b}`
  return `HF hata (${status}): ${b}`
}

import { sanitizeImagePrompt, getStockImageFallback } from "./prompt-guard"

export async function generateImage(prompt: string): Promise<ImageResult> {
  // Prompt Guard — saçma tutarsız promptları engelle
  const guard = sanitizeImagePrompt(prompt)
  if(!guard.allowed) return { ok:false, error: guard.reason || "Prompt reddedildi" }
  prompt = guard.prompt
  const token = process.env.HUGGINGFACE_API_TOKEN || process.env.HUGGINGFACE_API_TOKEN_2 || process.env.HUGGINGFACE_API_TOKEN_3

  // Güncel HF modelleri — SDXL deprecated, yerine SD3 + FLUX dene
  // hf-inference doküman örneği: stabilityai/stable-diffusion-3-medium-diffusers [9], FLUX.1-dev/schnell [2][5]
  const hfCandidates = token
    ? [
        "black-forest-labs/FLUX.1-schnell",
        "black-forest-labs/FLUX.1-dev",
        "stabilityai/stable-diffusion-3-medium-diffusers",
        "stabilityai/stable-diffusion-3.5-large",
      ]
    : []

  let lastErr = ""
  for (const model of hfCandidates) {
    const url = `https://router.huggingface.co/hf-inference/models/${model}`
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Wait-For-Model": "true",
        },
        body: JSON.stringify({ inputs: prompt }),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => "")
        lastErr = friendlyHfError(res.status, text) + ` | ${url}`
        if (res.status === 403) {
          // token sorunu — diğer HF modelleri de aynı hatayı verecek, Pollinations'a geç
          break
        }
        if (res.status === 503 && text.includes("loading")) {
          await new Promise((r) => setTimeout(r, 1200))
        }
        // 410 deprecated -> sıradaki HF modelini dene
        continue
      }

      const ct = res.headers.get("content-type") ?? ""
      if (ct.startsWith("image/")) {
        const buf = Buffer.from(await res.arrayBuffer())
        return { ok: true, buffer: buf, contentType: ct }
      }
      const text = await res.text()
      lastErr = `Beklenmeyen tip ${ct}: ${text.slice(0, 300)} | ${url}`
      continue
    } catch (err: any) {
      lastErr = `HF hata: ${err?.message || err} | ${model}`
      continue
    }
  }

  // ----- FALLBACK: Pollinations (beleş, token yok, her zaman çalışır) -----
  // https://image.pollinations.ai/p/{prompt}?width=1024&height=1024&model=flux&nologo=true
  // Vercel'den dış ağ serbest, sandbox kısıtlı olsa bile production'da çalışır
  try {
    const encoded = encodeURIComponent(prompt)
    // Pollinations destekler: flux, turbo, gptimage
    const pollUrls = [
      `https://image.pollinations.ai/p/${encoded}?width=1024&height=1024&model=flux&nologo=true&enhance=true`,
      `https://image.pollinations.ai/p/${encoded}?width=1024&height=1024&model=turbo&nologo=true`,
    ]
    for (const url of pollUrls) {
      try {
        const res = await fetch(url, { headers: { Accept: "image/*" } })
        if (!res.ok) {
          lastErr += ` | Pollinations ${res.status}: ${await res.text().catch(() => "")} | ${url}`
          continue
        }
        const ct = res.headers.get("content-type") ?? "image/jpeg"
        if (!ct.startsWith("image/")) {
          lastErr += ` | Pollinations tip hatası ${ct} | ${url}`
          continue
        }
        const buf = Buffer.from(await res.arrayBuffer())
        if (buf.length < 1000) {
          lastErr += ` | Pollinations boş resim | ${url}`
          continue
        }
        return { ok: true, buffer: buf, contentType: ct }
      } catch (e: any) {
        lastErr += ` | Pollinations hata: ${e?.message || e}`
        continue
      }
    }
  } catch (e: any) {
    lastErr += ` | Pollinations genel hata: ${e?.message || e}`
  }

  // Token bitti — stok görsel fallback (Unsplash/Picsum)
  try {
    const stockUrl = getStockImageFallback(prompt)
    const res = await fetch(stockUrl, { headers: { Accept: "image/*" } })
    if (res.ok) {
      const ct = res.headers.get("content-type") ?? "image/jpeg"
      if (ct.startsWith("image/")) {
        const buf = Buffer.from(await res.arrayBuffer())
        if (buf.length > 1000) return { ok: true, buffer: buf, contentType: ct }
      }
    }
  } catch {}

  // Hiçbiri olmadıysa anlamlı hata döndür
  if (lastErr.includes("410") || lastErr.includes("deprecated")) {
    return {
      ok: false,
      error: `HF SDXL kaldırıldı (410 deprecated) [1]. Güncel model denendi ama olmadı. Pollinations fallback de başarısız. Stok görsel de denenemedi. Detay: ${lastErr.slice(0, 1200)}\n\nGeçici çözüm: Prompt'u daha kısa dene veya 10 sn sonra tekrar dene (model soğuk). /api/debug kontrol edebilirsin.`,
    }
  }
  return { ok: false, error: lastErr || "Tüm görsel modelleri başarısız oldu — stok görsel deneniyor." }
}
