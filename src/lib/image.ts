/* ------------------------------------------------------------------ */
/*  Görsel Üretimi - Hugging Face Inference Providers (router)        */
/*  Eski api-inference.huggingface.co artık 404 — yeni router.huggingface.co/hf-inference */
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
    return `❌ Hugging Face token'ında yetki yok (403).\n\nSebep: Token'ın "Make calls to Inference Providers" izni kapalı. Eski Read-token'lar artık yetmiyor — Hugging Face Mart 2026'dan beri fine-grained token istiyor [1].\n\nÇÖZÜM (2 dk):\n1) https://huggingface.co/settings/tokens → Create new token\n2) Type: **Fine-grained** seç\n3) **Inference → Make calls to Inference Providers** tikle (işte bu eksik!)\n4) Create → hf_... kopyala\n5) Vercel → Sucuk-Agent → Settings → Environment Variables → HUGGINGFACE_API_TOKEN'ı bu yeni token ile değiştir (Production+Preview+Development)\n6) Redeploy (Vercel otomatik yapar)\n\nDetay: https://huggingface.co/docs/inference-providers/index#authentication [15]\n\nHam hata: ${b}`
  }
  if (status === 401) return `401 Unauthorized — token yanlış/süresi dolmuş. Vercel'deki HUGGINGFACE_API_TOKEN'ı kontrol et. Ham: ${b}`
  if (status === 429) return `429 Kota doldu — HF free kotası bitti veya billing gerekli. https://huggingface.co/settings/billing bak. Ham: ${b}`
  return `Hugging Face hata (${status}): ${b}`
}

export async function generateImage(prompt: string): Promise<ImageResult> {
  const token = process.env.HUGGINGFACE_API_TOKEN
  if (!token) {
    return {
      ok: false,
      error: "HUGGINGFACE_API_TOKEN tanımlanmamış. https://huggingface.co/settings/tokens → Fine-grained → Inference > Make calls to Inference Providers işaretli token oluştur → Vercel env'e ekle.",
    }
  }

  const candidates = [
    "black-forest-labs/FLUX.1-schnell",
    "stabilityai/stable-diffusion-xl-base-1.0",
  ]

  let lastErr = ""
  for (const model of candidates) {
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
        lastErr = friendlyHfError(res.status, text) + ` | endpoint: ${url}`
        // 503 loading ise bekle ve diğer modele geç
        if (res.status === 503 && text.includes("loading")) {
          await new Promise((r) => setTimeout(r, 2000))
          if (candidates.indexOf(model) < candidates.length - 1) continue
        }
        // 403 yetki hatasıysa diğer modeli de deneme — direkt dön, çünkü token sorunu tüm modellerde aynı
        if (res.status === 403) {
          return { ok: false, error: lastErr }
        }
        if (candidates.indexOf(model) < candidates.length - 1) continue
        return { ok: false, error: lastErr }
      }

      const ct = res.headers.get("content-type") ?? ""
      if (ct.startsWith("image/")) {
        const buf = Buffer.from(await res.arrayBuffer())
        return { ok: true, buffer: buf, contentType: ct }
      }
      const text = await res.text()
      lastErr = `Beklenmeyen yanıt tipi ${ct}: ${text.slice(0, 300)} | ${url}`
      if (candidates.indexOf(model) < candidates.length - 1) continue
      return { ok: false, error: lastErr }
    } catch (err: any) {
      lastErr = `Görsel üretim hatası: ${err?.message || err} | model: ${model} | ${url}`
      if (candidates.indexOf(model) < candidates.length - 1) continue
      return { ok: false, error: lastErr }
    }
  }
  return { ok: false, error: lastErr || "Tüm görsel modelleri başarısız oldu." }
}
