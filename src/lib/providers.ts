/* ------------------------------------------------------------------ */
/*  API Sağlayıcı Yönetimi ve Anahtar Döndürme (Key Rotation)         */
/* ------------------------------------------------------------------ */

export type ProviderId =
  | "google"
  | "openai"
  | "groq"
  | "grok"
  | "openrouter"
  | "deepseek"
  | "kimi"
  | "nvidia"
  | "huggingface";

export interface ProviderKey {
  provider: ProviderId;
  index: number;
  key: string | undefined;
}

export interface ProviderModel {
  provider: ProviderId;
  model: string;
  endpoint: string;
  chat: boolean;
}

export interface LLMResponse {
  text: string;
  provider: string;
  model: string;
  exhausted: boolean;
}

/*  Her sağlayıcıdan 3'er anahtar tanımı (env değişkenlerinden).       */
const PROVIDER_ENV_KEYS: Record<ProviderId, string[]> = {
  google: [
    "GOOGLE_API_KEY_1",
    "GOOGLE_API_KEY_2",
    "GOOGLE_API_KEY_3",
  ],
  openai: ["OPENAI_API_KEY_1", "OPENAI_API_KEY_2", "OPENAI_API_KEY_3"],
  groq: ["GROQ_API_KEY_1", "GROQ_API_KEY_2", "GROQ_API_KEY_3"],
  grok: ["", "", ""], // disabled by user
  openrouter: ["OPENROUTER_API_KEY_1", "OPENROUTER_API_KEY_2", "OPENROUTER_API_KEY_3"],
  deepseek: ["DEEPSEEK_API_KEY_1", "DEEPSEEK_API_KEY_2", "DEEPSEEK_API_KEY_3"],
  kimi: ["KIMI_API_KEY_1", "KIMI_API_KEY_2", "KIMI_API_KEY_3"],
  nvidia: ["NVIDIA_API_KEY_1", "NVIDIA_API_KEY_2", "NVIDIA_API_KEY_3", "NVIDIA_API_KEY_4", "NVIDIA_API_KEY_5"],
  huggingface: ["HUGGINGFACE_API_TOKEN", "HUGGINGFACE_API_TOKEN_2", "HUGGINGFACE_API_TOKEN_3", "HUGGINGFACE_API_TOKEN_4", "HUGGINGFACE_API_TOKEN_5"],
};

/*  Model eşlemeleri (sağlayıcı -> model -> endpoint) — tüm beleş/ücretli modeller burada  */
export const PROVIDER_MODELS: Record<ProviderId, ProviderModel[]> = {
  google: [
    { provider: "google", model: "gemini-3.8-flash", endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent", chat: true },
    { provider: "google", model: "gemini-3.8-flash-lite", endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent", chat: true },
  ],
  openai: [
    { provider: "openai", model: "gpt-4o-mini", endpoint: "https://api.openai.com/v1/chat/completions", chat: true },
    { provider: "openai", model: "gpt-4o", endpoint: "https://api.openai.com/v1/chat/completions", chat: true },
  ],
  groq: [
    { provider: "groq", model: "openai/gpt-oss-120b", endpoint: "https://api.groq.com/openai/v1/chat/completions", chat: true },
    { provider: "groq", model: "openai/gpt-oss-20b", endpoint: "https://api.groq.com/openai/v1/chat/completions", chat: true },
  ],
  grok: [],
  openrouter: [
    { provider: "openrouter", model: "anthropic/claude-sonnet-5.5", endpoint: "https://openrouter.ai/api/v1/chat/completions", chat: true },
    { provider: "openrouter", model: "anthropic/claude-sonnet-5", endpoint: "https://openrouter.ai/api/v1/chat/completions", chat: true },
    { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct:free", endpoint: "https://openrouter.ai/api/v1/chat/completions", chat: true },
  ],
  deepseek: [
    { provider: "deepseek", model: "deepseek-chat", endpoint: "https://api.deepseek.com/v1/chat/completions", chat: true },
    { provider: "deepseek", model: "deepseek-reasoner", endpoint: "https://api.deepseek.com/v1/chat/completions", chat: true },
  ],
  kimi: [
    { provider: "kimi", model: "moonshot-v1-8k", endpoint: "https://api.moonshot.ai/v1/chat/completions", chat: true },
    { provider: "kimi", model: "moonshot-v1-32k", endpoint: "https://api.moonshot.ai/v1/chat/completions", chat: true },
  ],
  nvidia: [
    { provider: "nvidia", model: "nvidia/llama-3.3-nemotron-super-49b-v1", endpoint: "https://integrate.api.nvidia.com/v1/chat/completions", chat: true },
    { provider: "nvidia", model: "nvidia/llama-3.1-nemotron-70b-instruct", endpoint: "https://integrate.api.nvidia.com/v1/chat/completions", chat: true },
  ],
  huggingface: [
    { provider: "huggingface", model: "Qwen/Qwen2.5-7B-Instruct", endpoint: "https://router.huggingface.co/v1/chat/completions", chat: true },
    { provider: "huggingface", model: "Qwen/Qwen2.5-Coder-7B-Instruct", endpoint: "https://router.huggingface.co/v1/chat/completions", chat: true },
    { provider: "huggingface", model: "HuggingFaceH4/zephyr-7b-beta", endpoint: "https://router.huggingface.co/v1/chat/completions", chat: true },
  ],
};

/* Görev bazlı model kataloğu — UI'da gösterilir, her modele bir görev verdik */
export type ModelTask = "genel" | "kod" | "gorsel" | "akıl" | "arama" | "çeviri";

export interface CatalogEntry {
  provider: ProviderId;
  model: string;
  label: string;
  task: ModelTask;
  free: boolean;
  desc: string;
}

export const MODEL_CATALOG: CatalogEntry[] = [
  // Genel sohbet — en hızlı/ucuz beleşler
  { provider: "groq", model: "openai/gpt-oss-20b", label: "GPT-OSS 20B (Groq) ⚡", task: "genel", free: true, desc: "Genel sohbet, hızlı yanıt" },
  { provider: "google", model: "gemini-3.8-flash", label: "Gemini 3.8 Flash", task: "genel", free: true, desc: "Genel asistan, dengeli" },
  { provider: "huggingface", model: "Qwen/Qwen2.5-7B-Instruct", label: "Qwen 2.5 7B", task: "genel", free: true, desc: "Beleş, açık kaynak genel" },
  { provider: "openai", model: "gpt-4o-mini", label: "GPT-4o mini", task: "genel", free: false, desc: "OpenAI dengeli" },

  // Kod
  { provider: "groq", model: "openai/gpt-oss-120b", label: "GPT-OSS 120B (Groq) 🧠", task: "kod", free: true, desc: "Kod, debug, mimari — en güçlü beleş" },
  { provider: "openrouter", model: "anthropic/claude-sonnet-5.5", label: "Claude Sonnet 5.5", task: "kod", free: false, desc: "Kod + uzun proje, en kaliteli" },
  { provider: "huggingface", model: "Qwen/Qwen2.5-Coder-7B-Instruct", label: "Qwen Coder 7B", task: "kod", free: true, desc: "Kod odaklı beleş" },
  { provider: "kimi", model: "moonshot-v1-32k", label: "Moonshot 32K", task: "kod", free: false, desc: "Uzun dosya/kod bağlamı" },

  // Akıl / reasoning
  { provider: "deepseek", model: "deepseek-reasoner", label: "DeepSeek Reasoner", task: "akıl", free: false, desc: "Adım adım akıl yürütme" },
  { provider: "nvidia", model: "nvidia/llama-3.3-nemotron-super-49b-v1", label: "Nemotron Super 49B", task: "akıl", free: false, desc: "Derin analiz, mantık" },
  { provider: "openai", model: "gpt-4o", label: "GPT-4o", task: "akıl", free: false, desc: "Karışık muhakeme" },

  // Görsel
  { provider: "huggingface", model: "black-forest-labs/FLUX.1-schnell", label: "FLUX.1 Schnell (Görsel)", task: "gorsel", free: true, desc: "Metinden görsel — köpek çiz vs." },
  { provider: "huggingface", model: "stabilityai/stable-diffusion-xl-base-1.0", label: "SDXL 1.0 (Görsel)", task: "gorsel", free: true, desc: "Poster, logo, tasarla" },

  // Arama
  { provider: "groq", model: "openai/gpt-oss-120b", label: "Groq + Web Arama", task: "arama", free: true, desc: "Güncel haber, fiyat, web" },
  { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B (OR Free)", task: "arama", free: true, desc: "Beleş arama özetleme" },

  // Çeviri / genel ek
  { provider: "kimi", model: "moonshot-v1-8k", label: "Moonshot 8K", task: "çeviri", free: false, desc: "Çeviri, özet, kısa metin" },
  { provider: "google", model: "gemini-3.8-flash-lite", label: "Gemini 3.8 Lite", task: "çeviri", free: true, desc: "Hızlı çeviri/özet" },
  { provider: "deepseek", model: "deepseek-chat", label: "DeepSeek Chat", task: "genel", free: false, desc: "Genel, uzun bağlam" },
  { provider: "nvidia", model: "nvidia/llama-3.1-nemotron-70b-instruct", label: "Nemotron 70B", task: "genel", free: false, desc: "Genel asistan alternatifi" },
];

/*  Sunucu tarafında istek içinde key durumunu takip eden yönetici.     */
export class ProviderManager {
  private keys: ProviderKey[] = []
  private cursor = new Map<ProviderId, number>()

  constructor() {
    for (const [provider, envNames] of Object.entries(PROVIDER_ENV_KEYS)) {
      envNames.forEach((name, i) => {
        const key = process.env[name]
        if (key) {
          this.keys.push({
            provider: provider as ProviderId,
            index: i + 1,
            key,
          })
        }
      })
      this.cursor.set(provider as ProviderId, 0)
    }
  }

  availableProviders(): ProviderId[] {
    const seen = new Set<string>()
    const out: ProviderId[] = []
    for (const k of this.keys) {
      if (!seen.has(k.provider)) {
        seen.add(k.provider)
        out.push(k.provider)
      }
    }
    return out
  }

  keysFor(provider: ProviderId): ProviderKey[] {
    return this.keys.filter((k) => k.provider === provider)
  }

  isExhausted(provider: ProviderId): boolean {
    return this.keysFor(provider).length === 0
  }

  async chat(
    provider: ProviderId,
    model: string,
    messages: { role: string; content: string }[],
    opts?: { temperature?: number; maxTokens?: number }
  ): Promise<LLMResponse> {
    const providerKeys = this.keysFor(provider)
    if (providerKeys.length === 0) {
      throw new Error(`limit_dolu:${provider}`)
    }

    // Görsel modelleri chat endpointi üzerinden denemeyelim — generateImage kullan
    const imageOnly = ["black-forest-labs/FLUX.1-schnell", "stabilityai/stable-diffusion-xl-base-1.0"]
    if (imageOnly.includes(model)) {
      throw new Error(`gorsel_model:${provider}:${model} — görsel için /api/image kullan`)
    }

    const modelEntry = PROVIDER_MODELS[provider].find((m) => m.model === model)
    if (!modelEntry) {
      // Bilinmeyen model ise aynı sağlayıcının ilk modelini dene (eski UI uyumu)
      const fallback = PROVIDER_MODELS[provider][0]
      if (!fallback) throw new Error(`model_bulunamadı:${provider}:${model}`)
      // fallback ile devam et ama hatayı da logla
      let lastError = `model_bulunamadı:${provider}:${model} -> fallback ${fallback.model}`
      for (const key of providerKeys) {
        try {
          const text = await this.callChatEndpoint(fallback, key.key!, messages, opts)
          return { text: text + `\n\n_(Not: ${model} bulunamadı, ${fallback.model} ile yanıtlandı)_`, provider, model: fallback.model, exhausted: false }
        } catch (err: any) {
          lastError = err?.message || String(err)
          if (this.isQuotaError(err)) continue
          continue
        }
      }
      throw new Error(`limit_dolu:${provider}:${lastError}`)
    }

    let lastError = ""
    for (const key of providerKeys) {
      try {
        const text = await this.callChatEndpoint(modelEntry, key.key!, messages, opts)
        return { text, provider, model, exhausted: false }
      } catch (err: any) {
        lastError = err?.message || String(err)
        if (this.isQuotaError(err)) continue
        continue
      }
    }

    throw new Error(`limit_dolu:${provider}:${lastError}`)
  }

  private async callChatEndpoint(
    model: ProviderModel,
    apiKey: string,
    messages: { role: string; content: string }[],
    opts?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const provider = model.provider
    const headers: Record<string, string> = { "Content-Type": "application/json" }

    if (provider === "google") {
      const url = `${model.endpoint}?key=${apiKey}`
      const body = {
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          temperature: opts?.temperature ?? 0.7,
          maxOutputTokens: opts?.maxTokens ?? 2048,
        },
      }
      const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) })
      if (!res.ok) throw await this.errorFromResponse(res)
      const json = await res.json()
      return json.candidates?.[0]?.content?.parts?.[0]?.text ?? "Boş yanıt."
    }

    if (provider === "huggingface") {
      headers["Authorization"] = `Bearer ${apiKey}`
      const body = {
        model: model.model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: opts?.temperature ?? 0.7,
        max_tokens: opts?.maxTokens ?? 2048,
        stream: false,
      }
      const url = "https://router.huggingface.co/v1/chat/completions"
      const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) })
      if (!res.ok) throw await this.errorFromResponse(res)
      const json = await res.json()
      return json.choices?.[0]?.message?.content ?? json.choices?.[0]?.text ?? "Boş yanıt."
    }

    headers["Authorization"] = `Bearer ${apiKey}`
    if (provider === "openrouter") {
      headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_SITE_URL ?? "https://localhost:3000"
      headers["X-Title"] = "Sucuk-Agent"
    }
    const body = {
      model: model.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.maxTokens ?? 2048,
      stream: false,
    }
    const res = await fetch(model.endpoint, { method: "POST", headers, body: JSON.stringify(body) })
    if (!res.ok) throw await this.errorFromResponse(res)
    const json = await res.json()
    return json.choices?.[0]?.message?.content ?? json.choices?.[0]?.text ?? "Boş yanıt."
  }

  private isQuotaError(err: any): boolean {
    const status = err?.status ?? err?.statusCode
    const msg = (err?.message ?? "").toString().toLowerCase()
    return (
      status === 401 ||
      status === 402 ||
      status === 403 ||
      status === 429 ||
      msg.includes("quota") ||
      msg.includes("rate limit") ||
      msg.includes("insufficient_quota") ||
      msg.includes("invalid api key") ||
      msg.includes("authentication")
    )
  }

  private async errorFromResponse(res: Response): Promise<Error> {
    let body = ""
    try { body = await res.text() } catch {}
    const e = new Error(`HTTP ${res.status}: ${res.statusText} - ${body.slice(0, 400)}`)
    ;(e as any).status = res.status
    ;(e as any).body = body
    return e
  }
}

export function createProviderManager(): ProviderManager {
  return new ProviderManager()
}

export const DEFAULT_PROVIDER_ORDER: ProviderId[] = [
  "groq",
  "google",
  "huggingface",
  "openrouter",
  "deepseek",
  "kimi",
  "nvidia",
  "openai",
]
