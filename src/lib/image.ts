/* ------------------------------------------------------------------ */
/*  Görsel Üretimi - Hugging Face Inference Providers (router)        */
/*  Eski api-inference.huggingface.co artık 404 veriyor, yeni        */
/*  endpoint: router.huggingface.co/hf-inference                      */
/*  Kaynak: HF docs 2025 - api-inference no longer supported [16]     */
/* ------------------------------------------------------------------ */

export interface ImageResult {
  ok: boolean;
  buffer?: Buffer;
  contentType?: string;
  error?: string;
}

export async function generateImage(prompt: string): Promise<ImageResult> {
  const token = process.env.HUGGINGFACE_API_TOKEN;
  if (!token) {
    return { ok: false, error: "HUGGINGFACE_API_TOKEN tanımlanmamış. HuggingFace'de https://huggingface.co/settings/tokens > New token (Inference, Read) oluşturup Vercel > Environment Variables > HUGGINGFACE_API_TOKEN olarak ekleyin." };
  }

  // Daha hızlı ve güncel model: FLUX.1-schnell (eski SDXL 6.9GB ve soğuk başlatma çok yavaş)
  // Fallback olarak SDXL de denenebilir ama öncelik FLUX
  const candidates = [
    "black-forest-labs/FLUX.1-schnell",
    "stabilityai/stable-diffusion-xl-base-1.0",
  ];

  for (const model of candidates) {
    const url = `https://router.huggingface.co/hf-inference/models/${model}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Wait-For-Model": "true",
        },
        body: JSON.stringify({ inputs: prompt }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        // Model yükleniyor ise 503 döner, sıradakine geç
        if (res.status === 503 && text.includes("loading")) {
          // Model warmup bekleniyor, bir kez daha dene
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        // Bu model için hata, sıradakine geç
        if (candidates.indexOf(model) < candidates.length - 1) continue;
        return {
          ok: false,
          error: `Hugging Face hata (${res.status}): ${text.slice(0, 400)} | endpoint: ${url} - api-inference.huggingface.co artık kapatıldı, router.huggingface.co kullanılmalı [16][12]`,
        };
      }

      const ct = res.headers.get("content-type") ?? "";
      if (ct.startsWith("image/")) {
        const buf = Buffer.from(await res.arrayBuffer());
        return { ok: true, buffer: buf, contentType: ct };
      }
      // Bazen JSON döner (hata veya base64)
      const text = await res.text();
      return { ok: false, error: `Beklenmeyen yanıt tipi ${ct}: ${text.slice(0,300)}` };
    } catch (err: any) {
      if (candidates.indexOf(model) < candidates.length - 1) continue;
      return { ok: false, error: `Görsel üretim hatası: ${err?.message || err} | model: ${model}` };
    }
  }
  return { ok: false, error: "Tüm görsel modelleri başarısız oldu." };
}
