/* ------------------------------------------------------------------ */
/*  API Sağlayıcı Yönetimi ve Anahtar Döndürme (Key Rotation)         */
/*  Görev dağılımı: her sağlayıcı ayrı iş, kota bitince sıradaki     */
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
  | "huggingface"
  | "pollinations";

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

/*  Her sağlayıcıdan 3-5 anahtar tanımı (env değişkenlerinden).       */
/*  3. madde: Kod / Görsel / Sohbet / Araştırma için AYRI key havuzu   */
const PROVIDER_ENV_KEYS: Record<ProviderId, string[]> = {
  google: [
    "GOOGLE_API_KEY_1",
    "GOOGLE_API_KEY_2",
    "GOOGLE_API_KEY_3",
    // Sohbet & Araştırma ayrı havuz (3. madde)
    "SOHBET_GOOGLE_KEY_1", "SOHBET_GOOGLE_KEY_2", "SOHBET_GOOGLE_KEY_3",
    "ARASTIRMA_GOOGLE_KEY_1", "DOKUMAN_GOOGLE_KEY_1",
  ],
  openai: [
    "OPENAI_API_KEY_1", "OPENAI_API_KEY_2", "OPENAI_API_KEY_3",
    "KOD_OPENAI_KEY_1", "KOD_OPENAI_KEY_2", "KOD_OPENAI_KEY_3",
    "SOHBET_OPENAI_KEY_1", "SOHBET_OPENAI_KEY_2",
  ],
  groq: [
    "GROQ_API_KEY_1", "GROQ_API_KEY_2", "GROQ_API_KEY_3",
    "KOD_GROQ_KEY_1", "ARASTIRMA_GROQ_KEY_1", "ARASTIRMA_GROQ_KEY_2", "ARASTIRMA_GROQ_KEY_3",
    "SOHBET_GROQ_KEY_1",
  ],
  grok: ["", "", ""], // disabled by user
  openrouter: ["OPENROUTER_API_KEY_1", "OPENROUTER_API_KEY_2", "OPENROUTER_API_KEY_3", "KOD_OPENROUTER_KEY_1"],
  deepseek: [
    "DEEPSEEK_API_KEY_1", "DEEPSEEK_API_KEY_2", "DEEPSEEK_API_KEY_3",
    "KOD_DEEPSEEK_KEY_1", "KOD_DEEPSEEK_KEY_2", "KOD_DEEPSEEK_KEY_3",
  ],
  kimi: ["KIMI_API_KEY_1", "KIMI_API_KEY_2", "KIMI_API_KEY_3", "KOD_KIMI_KEY_1"],
  nvidia: [
    "NVIDIA_API_KEY_1", "NVIDIA_API_KEY_2", "NVIDIA_API_KEY_3", "NVIDIA_API_KEY_4", "NVIDIA_API_KEY_5",
    "KOD_NVIDIA_KEY_1", "KOD_NVIDIA_KEY_2", "AKIL_NVIDIA_KEY_1",
  ],
  huggingface: [
    "HUGGINGFACE_API_TOKEN", "HUGGINGFACE_API_TOKEN_2", "HUGGINGFACE_API_TOKEN_3", "HUGGINGFACE_API_TOKEN_4", "HUGGINGFACE_API_TOKEN_5",
    // Görsel için ayrı (3. madde)
    "GORSEL_HF_TOKEN_1", "GORSEL_HF_TOKEN_2", "GORSEL_HF_TOKEN_3", "GORSEL_HF_TOKEN_4", "GORSEL_HF_TOKEN_5",
    "GORSEL_API_KEY_1", "GORSEL_API_KEY_2",
  ],
  pollinations: ["POLLINATIONS_API_KEY", "POLLINATIONS_API_KEY_2", "POLLINATIONS_API_KEY_3", "GORSEL_POLLINATIONS_KEY_1"],
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
  pollinations: [
    { provider: "pollinations", model: "flux", endpoint: "https://gen.pollinations.ai/image", chat: false },
    { provider: "pollinations", model: "turbo", endpoint: "https://gen.pollinations.ai/image", chat: false },
  ],
};

/* Görev bazlı model kataloğu — UI'da gösterilir, her modele bir görev verdik */
export type ModelTask = "genel" | "kod" | "gorsel" | "akıl" | "arama" | "çeviri" | "dokuman";

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
  { provider: "groq", model: "openai/gpt-oss-120b", label: "GPT-OSS 120B (Groq) 🧠", task: "kod", free: true, desc: "Kod, debug, mimari — ağır mantık yedeği" },
  { provider: "openrouter", model: "anthropic/claude-sonnet-5.5", label: "Claude Sonnet 5.5", task: "kod", free: false, desc: "Kod + uzun proje, en kaliteli" },
  { provider: "huggingface", model: "Qwen/Qwen2.5-Coder-7B-Instruct", label: "Qwen Coder 7B", task: "kod", free: true, desc: "Kod odaklı beleş" },
  { provider: "kimi", model: "moonshot-v1-32k", label: "Moonshot 32K", task: "kod", free: false, desc: "Uzun dosya/kod bağlamı" },

  // Akıl / reasoning — ağır mantık deepseek + nvidia (Görev 3)
  { provider: "deepseek", model: "deepseek-reasoner", label: "DeepSeek Reasoner 🧠", task: "akıl", free: false, desc: "Ağır mantık, adım adım — deepseek" },
  { provider: "nvidia", model: "nvidia/llama-3.3-nemotron-super-49b-v1", label: "Nemotron Super 49B ⚡", task: "akıl", free: false, desc: "Ağır mantık yedeği — nvidia 5 anahtar" },
  { provider: "openai", model: "gpt-4o", label: "GPT-4o", task: "akıl", free: false, desc: "Karışık muhakeme yedeği" },

    // Görsel — tek model, tek key, logosuz & hızlı
  { provider: "huggingface", model: "black-forest-labs/FLUX.1-schnell", label: "FLUX.1 Schnell ⚡ (Görsel) — tek model, logosuz, hızlı", task: "gorsel", free: true, desc: "Tek API key, 1-4 adım ~2sn — birincil" },
  { provider: "pollinations", model: "flux", label: "Pollinations Flux ⚡ (Görsel)", task: "gorsel", free: false, desc: "Hızlı, log yok — Pollinations API key ile (HF biterse devreye girer)" },
  { provider: "pollinations", model: "turbo", label: "Pollinations Turbo ⚡", task: "gorsel", free: false, desc: "Daha hızlı turbo, Pollinations yedeği" },

  // Arama
  { provider: "groq", model: "openai/gpt-oss-120b", label: "Groq + Web Arama", task: "arama", free: true, desc: "Güncel haber, fiyat, web" },
  { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B (OR Free)", task: "arama", free: true, desc: "Beleş arama özetleme" },

  // Çeviri — Görev 1: her prompt çevirilir (resimde de aktif)
  { provider: "google", model: "gemini-3.8-flash", label: "Gemini Çeviri 🌐", task: "çeviri", free: true, desc: "Her ne derse desin çevir — gömülü" },
  { provider: "kimi", model: "moonshot-v1-8k", label: "Moonshot 8K", task: "çeviri", free: false, desc: "Çeviri yedeği" },
  { provider: "google", model: "gemini-3.8-flash-lite", label: "Gemini 3.8 Lite", task: "çeviri", free: true, desc: "Hızlı çeviri/özet yedeği" },
  { provider: "deepseek", model: "deepseek-chat", label: "DeepSeek Chat", task: "genel", free: false, desc: "Genel, uzun bağlam" },
  { provider: "nvidia", model: "nvidia/llama-3.1-nemotron-70b-instruct", label: "Nemotron 70B", task: "genel", free: false, desc: "Genel asistan alternatifi" },

  // Doküman / Slayt — Görev 2
  { provider: "google", model: "gemini-3.8-flash", label: "Gemini Docs ⚡", task: "dokuman", free: true, desc: "Döküman/slayt birincil" },
  { provider: "openai", model: "gpt-4o-mini", label: "GPT-4o mini Docs", task: "dokuman", free: false, desc: "Döküman yedeği" },
];

/* 3. madde: Her görev için AYRI API key havuzu — env isimleri de ayrışık */
export const TASK_API_KEYS: Record<ModelTask, { label: string; envPrefix: string; providers: ProviderId[] }> = {
  kod: { label: "Kod", envPrefix: "KOD_", providers: ["openai","deepseek","nvidia","groq","openrouter","kimi"] },
  gorsel: { label: "Görsel", envPrefix: "GORSEL_", providers: ["huggingface","pollinations"] },
  arama: { label: "Araştırma", envPrefix: "ARASTIRMA_", providers: ["groq","google","openrouter"] },
  genel: { label: "Sohbet (Genel)", envPrefix: "SOHBET_", providers: ["google","openai","groq","kimi","huggingface"] },
  akıl: { label: "Akıl / Reasoning", envPrefix: "AKIL_", providers: ["deepseek","nvidia"] },
  çeviri: { label: "Çeviri", envPrefix: "CEVIRI_", providers: ["google","kimi"] },
  dokuman: { label: "Döküman", envPrefix: "DOKUMAN_", providers: ["google","openai","kimi"] },
};

/* ------------------------------------------------------------------ */
/*  YENİ: Görev bazlı dağıtım haritası — kota bitince sıradaki devreye  */
/*  Her görev kendi provider listesine sahip, birin kotası bitince     */
/*  öbür API otomatik devralır (key rotation + provider fallback)       */
/*  3. madde: Her görev ayrı key havuzu kullanır                       */
/* ------------------------------------------------------------------ */

export const TASK_DISTRIBUTION: Record<ModelTask, { primary: ProviderId; fallbacks: ProviderId[]; desc: string }> = {
  genel: {
    primary: "google",
    fallbacks: ["openai", "huggingface", "openrouter", "groq", "kimi", "deepseek", "nvidia"],
    desc: "Genel sohbet — Gemini birincil (SOHBET_* keyleri), OpenAI/HF yedek",
  },
  kod: {
    primary: "openai",
    fallbacks: ["deepseek", "nvidia", "groq", "openrouter", "kimi", "huggingface", "google"],
    desc: "Kod — OpenAI birincil (KOD_* keyleri) → DeepSeek/NVIDIA/Groq yedek",
  },
  gorsel: {
    primary: "pollinations",
    fallbacks: ["huggingface"],
    desc: "Görsel — en az token: Pollinations birincil (free, logosuz) → HF FLUX schnell yedek",
  },
  akıl: {
    primary: "deepseek",
    fallbacks: ["nvidia", "openai", "groq", "kimi", "openrouter", "google"],
    desc: "Ağır mantık — DeepSeek birincil (AKIL_*), NVIDIA yedek (5 anahtar)",
  },
  arama: {
    primary: "groq",
    fallbacks: ["google", "openrouter", "huggingface", "kimi"],
    desc: "Araştırma — Groq birincil (ARASTIRMA_*), Google/OpenRouter yedek",
  },
  çeviri: {
    primary: "google",
    fallbacks: ["kimi", "openai", "groq", "openrouter"],
    desc: "Çeviri — Google birincil, KIMI/OpenAI yedek",
  },
  dokuman: {
    primary: "google",
    fallbacks: ["openai", "kimi", "nvidia", "huggingface"],
    desc: "Döküman/Slayt — Google birincil (DOKUMAN_*), OpenAI yedek",
  },
};

// Görevden provider sırasını çıkar (birincil + yedekler)
export function getProvidersForTask(task: ModelTask): ProviderId[] {
  const dist = TASK_DISTRIBUTION[task]
  if (!dist) return DEFAULT_PROVIDER_ORDER as ProviderId[]
  return [dist.primary, ...dist.fallbacks]
}

// Kota dostu fallback zinciri — birincil önce, sonra görev yedekleri, sonra global
export function getFallbackChain(task: ModelTask, primaryProvider: ProviderId): Array<{ provider: ProviderId; model: string }> {
  const taskProviders = getProvidersForTask(task)
  // primary'i başa al, tekrarları at
  const ordered: ProviderId[] = [primaryProvider, ...taskProviders.filter(p => p !== primaryProvider)]
  // global order'dan eksikleri ekle (tam kapsama)
  for (const p of DEFAULT_PROVIDER_ORDER) {
    if (!(ordered as string[]).includes(p)) ordered.push(p as ProviderId)
  }
  // her provider için en uygun modeli seç (görevle eşleşen ilk model)
  return ordered.map(p => {
    const catalogForTask = MODEL_CATALOG.filter(c => c.task === task && c.provider === p)
    if (catalogForTask.length) return { provider: p, model: catalogForTask[0].model }
    // yoksa provider'ın ilk modeli
    const first = PROVIDER_MODELS[p]?.[0]
    return { provider: p, model: first ? first.model : (DEFAULT_MODEL_FOR_PROVIDER as any)[p] || "gpt-4o-mini" }
  }).filter(x => !!x.model)
}

export const DEFAULT_MODEL_FOR_PROVIDER: Record<ProviderId, string> = {
  groq: "openai/gpt-oss-20b",
  openrouter: "anthropic/claude-sonnet-5.5",
  deepseek: "deepseek-chat",
  kimi: "moonshot-v1-8k",
  nvidia: "nvidia/llama-3.3-nemotron-super-49b-v1",
  openai: "gpt-4o-mini",
  grok: "grok-2-latest",
  google: "gemini-3.8-flash",
  huggingface: "Qwen/Qwen2.5-7B-Instruct",
  pollinations: "flux",
}

/*  Sunucu tarafında istek içinde key durumunu takip eden yönetici.     */
export class ProviderManager {
  private keys: ProviderKey[] = []
  private cursor = new Map<ProviderId, number>()
  private exhaustedKeys = new Set<string>() // "provider:index" geçici kara liste (kota biten anahtar)

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
    // kota biten anahtarları atla, cursor ile rotasyon
    const all = this.keys.filter((k) => k.provider === provider)
    const healthy = all.filter(k => !this.exhaustedKeys.has(`${k.provider}:${k.index}`))
    // eğer hepsi exhausted ise tüm listeyi döndür (son şans)
    if (healthy.length === 0) return all
    // cursor ile döndür (round-robin)
    const cur = this.cursor.get(provider) || 0
    if (cur === 0) return healthy
    return [...healthy.slice(cur), ...healthy.slice(0, cur)]
  }

  rawKeysFor(provider: ProviderId): ProviderKey[] {
    return this.keys.filter((k) => k.provider === provider)
  }

  isExhausted(provider: ProviderId): boolean {
    return this.keysFor(provider).length === 0
  }

  markExhausted(provider: ProviderId, index: number) {
    const k = `${provider}:${index}`
    this.exhaustedKeys.add(k)
    setTimeout(()=> this.exhaustedKeys.delete(k), 60_000)
  }

  getKeyHealth(): Record<string, { total: number; healthy: number; exhausted: string[] }> {
    const out: any = {}
    for (const p of Object.keys(PROVIDER_ENV_KEYS) as ProviderId[]) {
      const all = this.rawKeysFor(p)
      const healthy = this.keysFor(p)
      out[p] = {
        total: all.length,
        healthy: healthy.length,
        exhausted: Array.from(this.exhaustedKeys).filter(k => k.startsWith(`${p}:`)),
      }
    }
    return out
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
    const imageOnly = ["black-forest-labs/FLUX.1-schnell"]
    if (imageOnly.includes(model)) {
      throw new Error(`gorsel_model:${provider}:${model} — görsel için /api/image kullan`)
    }

    const modelEntry = PROVIDER_MODELS[provider].find((m) => m.model === model)
    if (!modelEntry) {
      const fallback = PROVIDER_MODELS[provider][0]
      if (!fallback) throw new Error(`model_bulunamadı:${provider}:${model}`)
      let lastError = `model_bulunamadı:${provider}:${model} -> fallback ${fallback.model}`
      for (const key of providerKeys) {
        try {
          const text = await this.callChatEndpoint(fallback, key.key!, messages, opts)
          this.advanceCursor(provider) // başarılı anahtarı bir sonrakine kaydır (yük dağılımı)
          return { text: text + `\n\n_(Not: ${model} bulunamadı, ${fallback.model} ile yanıtlandı)_`, provider, model: fallback.model, exhausted: false }
        } catch (err: any) {
          lastError = err?.message || String(err)
          if (this.isQuotaError(err)) {
            this.markExhausted(provider, key.index)
            continue
          }
          continue
        }
      }
      throw new Error(`limit_dolu:${provider}:${lastError}`)
    }

    let lastError = ""
    for (const key of providerKeys) {
      try {
        const text = await this.callChatEndpoint(modelEntry, key.key!, messages, opts)
        this.advanceCursor(provider)
        return { text, provider, model, exhausted: false }
      } catch (err: any) {
        lastError = err?.message || String(err)
        if (this.isQuotaError(err)) {
          this.markExhausted(provider, key.index) // bir anahtar kota biterse sıradaki devreye girer
          continue
        }
        // diğer hatada da sıradaki key'i dene (yük dağılımı)
        continue
      }
    }

    throw new Error(`limit_dolu:${provider}:${lastError}`)
  }

  private advanceCursor(provider: ProviderId) {
    const cur = this.cursor.get(provider) || 0
    const total = this.rawKeysFor(provider).length
    if (total > 0) this.cursor.set(provider, (cur + 1) % total)
  }

  private async fetchWithTimeout(url: string, init: RequestInit, ms = 8000): Promise<Response> {
    const ac = new AbortController()
    const t = setTimeout(() => ac.abort(), ms)
    try {
      const r = await fetch(url, { ...(init as any), signal: ac.signal } as any)
      return r
    } catch (e: any) {
      if (e?.name === "AbortError") throw Object.assign(new Error("timeout:" + ms + "ms"), { status: 408 })
      throw e
    } finally { clearTimeout(t) }
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
          maxOutputTokens: opts?.maxTokens ?? 1024,
        },
      }
      const res = await this.fetchWithTimeout(url, { method: "POST", headers, body: JSON.stringify(body) }, 9000)
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
        max_tokens: opts?.maxTokens ?? 1024,
        stream: false,
      }
      const url = "https://router.huggingface.co/v1/chat/completions"
      const res = await this.fetchWithTimeout(url, { method: "POST", headers, body: JSON.stringify(body) }, 9000)
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
      max_tokens: opts?.maxTokens ?? 1024,
      stream: false,
    }
    const res = await this.fetchWithTimeout(model.endpoint, { method: "POST", headers, body: JSON.stringify(body) }, 8000)
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
      msg.includes("authentication") ||
      msg.includes("limit_dolu") ||
      msg.includes("exhausted")
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
  "pollinations",
  "openrouter",
  "deepseek",
  "kimi",
  "nvidia",
  "openai",
]
