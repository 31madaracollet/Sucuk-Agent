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
  nvidia: ["NVIDIA_API_KEY_1", "NVIDIA_API_KEY_2", "NVIDIA_API_KEY_3"],
  huggingface: ["HUGGINGFACE_API_TOKEN", "", ""],
};

/*  Model eşlemeleri (sağlayıcı -> model -> endpoint)                  */
export const PROVIDER_MODELS: Record<ProviderId, ProviderModel[]> = {
  google: [
    { provider: "google", model: "gemini-3.8-flash", endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent", chat: true },
    { provider: "google", model: "gemini-3.8-flash", endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent", chat: true },
  ],
  openai: [
    { provider: "openai", model: "gpt-4o", endpoint: "https://api.openai.com/v1/chat/completions", chat: true },
    { provider: "openai", model: "gpt-4o-mini", endpoint: "https://api.openai.com/v1/chat/completions", chat: true },
  ],
  groq: [
    { provider: "groq", model: "openai/gpt-oss-120b", endpoint: "https://api.groq.com/openai/v1/chat/completions", chat: true },
    { provider: "groq", model: "openai/gpt-oss-20b", endpoint: "https://api.groq.com/openai/v1/chat/completions", chat: true },
  ],
  grok: [],
  openrouter: [
    { provider: "openrouter", model: "anthropic/claude-sonnet-5.5", endpoint: "https://openrouter.ai/api/v1/chat/completions", chat: true },
    { provider: "openrouter", model: "anthropic/claude-sonnet-5", endpoint: "https://openrouter.ai/api/v1/chat/completions", chat: true },
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
    { provider: "huggingface", model: "HuggingFaceH4/zephyr-7b-beta", endpoint: "https://router.huggingface.co/v1/chat/completions", chat: true },
  ],
};

/*  Sunucu tarafında istek içinde key durumunu takip eden yönetici.     */
export class ProviderManager {
  private keys: ProviderKey[] = [];
  private cursor = new Map<ProviderId, number>(); // provider -> next index denemesi

  constructor() {
    for (const [provider, envNames] of Object.entries(PROVIDER_ENV_KEYS)) {
      envNames.forEach((name, i) => {
        const key = process.env[name];
        if (key) {
          this.keys.push({
            provider: provider as ProviderId,
            index: i + 1,
            key,
          });
        }
      });
      this.cursor.set(provider as ProviderId, 0);
    }
  }

  /** Yapılandırılmış sağlayıcı adlarını listeler. */
  availableProviders(): ProviderId[] {
    const seen = new Set<string>();
    const out: ProviderId[] = [];
    for (const k of this.keys) {
      if (!seen.has(k.provider)) {
        seen.add(k.provider);
        out.push(k.provider);
      }
    }
    return out;
  }

  /** Belirli bir sağlayıcının kullanabileceği anahtarları döner. */
  keysFor(provider: ProviderId): ProviderKey[] {
    return this.keys.filter((k) => k.provider === provider);
  }

  /** Tüm anahtarlar tükendiyse true. */
  isExhausted(provider: ProviderId): boolean {
    return this.keysFor(provider).length === 0;
  }

  /**
   * Sohbet modu çağrısı. Anahtarları sırayla dener; bir anahtar kota
   * hatası (401/402/429) verirse bir sonraki Anahtara geçer.
   */
  async chat(
    provider: ProviderId,
    model: string,
    messages: { role: string; content: string }[],
    opts?: { temperature?: number; maxTokens?: number }
  ): Promise<LLMResponse> {
    const providerKeys = this.keysFor(provider);
    if (providerKeys.length === 0) {
      throw new Error(`limit_dolu:${provider}`);
    }

    const modelEntry = PROVIDER_MODELS[provider].find((m) => m.model === model);
    if (!modelEntry) {
      throw new Error(`model_bulunamadı:${provider}:${model}`);
    }

    let lastError = "";
    for (const key of providerKeys) {
      try {
        const text = await this.callChatEndpoint(modelEntry, key.key!, messages, opts);
        return { text, provider, model, exhausted: false };
      } catch (err: any) {
        lastError = err?.message || String(err);
        if (this.isQuotaError(err)) {
          // Bu anahtar günlük kotasını doldu, sıradakine geç.
          continue;
        }
        // Diğer hatalar (ağ, sunucu) için bir kez daha bir sonraki anahtarla denenir.
        continue;
      }
    }

    // Sağlayıcının tüm anahtarları tükendi.
    throw new Error(`limit_dolu:${provider}:${lastError}`);
  }

  private async callChatEndpoint(
    model: ProviderModel,
    apiKey: string,
    messages: { role: string; content: string }[],
    opts?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const provider = model.provider;
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    if (provider === "google") {
      const url = `${model.endpoint}?key=${apiKey}`;
      const body = {
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          temperature: opts?.temperature ?? 0.7,
          maxOutputTokens: opts?.maxTokens ?? 2048,
        },
      };
      const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
      if (!res.ok) throw await this.errorFromResponse(res);
      const json = await res.json();
      return json.candidates?.[0]?.content?.parts?.[0]?.text ?? "Boş yanıt.";
    }

    if (provider === "huggingface") {
      // Yeni HF Inference Providers: OpenAI-uyumlu router.huggingface.co/v1 [6][12][16]
      // Eski api-inference.huggingface.co artık 404 [16]
      headers["Authorization"] = `Bearer ${apiKey}`;
      const body = {
        model: model.model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: opts?.temperature ?? 0.7,
        max_tokens: opts?.maxTokens ?? 2048,
        stream: false,
      };
      const url = "https://router.huggingface.co/v1/chat/completions";
      const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
      if (!res.ok) throw await this.errorFromResponse(res);
      const json = await res.json();
      return json.choices?.[0]?.message?.content ?? json.choices?.[0]?.text ?? "Boş yanıt.";
    }

    // OpenAI uyumlu: OpenAI, Groq, Grok, OpenRouter, DeepSeek, Kimi, Nvidia
    headers["Authorization"] = `Bearer ${apiKey}`;
    if (provider === "openrouter") {
      headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_SITE_URL ?? "https://localhost:3000";
      headers["X-Title"] = "Sucuk-Agent";
    }
    const body = {
      model: model.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.maxTokens ?? 2048,
      stream: false,
    };
    const res = await fetch(model.endpoint, { method: "POST", headers, body: JSON.stringify(body) });
    if (!res.ok) throw await this.errorFromResponse(res);
    const json = await res.json();
    return json.choices?.[0]?.message?.content ?? json.choices?.[0]?.text ?? "Boş yanıt.";
  }

  private isQuotaError(err: any): boolean {
    const status = err?.status ?? err?.statusCode;
    const msg = (err?.message ?? "").toString().toLowerCase();
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
    );
  }

  private async errorFromResponse(res: Response): Promise<Error> {
    let body = "";
    try { body = await res.text(); } catch {}
    const e = new Error(`HTTP ${res.status}: ${res.statusText} - ${body.slice(0,300)}`);
    (e as any).status = res.status;
    (e as any).body = body;
    return e;
  }
}

/* Tekton-ish global manager (serverless ortamında istek başı yeni olur). */
export function createProviderManager(): ProviderManager {
  return new ProviderManager();
}

/* Varsayılan sohbet sağlayıcı sırası (düz sohbet modunda). */
export const DEFAULT_PROVIDER_ORDER: ProviderId[] = [
  "groq",
  "openrouter",
  "deepseek",
  "kimi",
  "nvidia",
  "openai",
  "google",
  "huggingface", // grok disabled
];