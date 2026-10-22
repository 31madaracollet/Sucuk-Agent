/* ------------------------------------------------------------------ */
/*  Görsel Üretimi - Hugging Face Inference API                       */
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
    return { ok: false, error: "HUGGINGFACE_API_TOKEN tanımlanmamış." };
  }

  const model = "stabilityai/stable-diffusion-xl-base-1.0";
  const url = `https://api-inference.huggingface.co/models/${model}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        error: `Hugging Face hata (${res.status}): ${text.slice(0, 300)}`,
      };
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get("content-type") ?? "image/png";
    return { ok: true, buffer: buf, contentType: ct };
  } catch (err: any) {
    return { ok: false, error: `Görsel üretim hatası: ${err?.message || err}` };
  }
}
