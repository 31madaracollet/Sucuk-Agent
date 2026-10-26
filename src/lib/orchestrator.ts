/* ------------------------------------------------------------------ */
/*  Orkestratör Yönlendirici — Akıllı görev ataması                  */
/*  Her mesaja bir görev verilir ve beleş modellere öncelik verilir  */
/*  Her sağlayıcı ayrı görev: kota bitince sıradaki API devralır     */
/* ------------------------------------------------------------------ */

import type { ProviderId, RouteDecision } from "@/types"
import type { ModelTask } from "@/lib/providers"
import { TASK_DISTRIBUTION } from "@/lib/providers"

function hasAny(m: string, arr: string[]) {
  return arr.some((k) => m.includes(k))
}

function dailySeed(){ return new Date().toISOString().slice(0,10) }
function pickRotated<T>(pool: T[], seed: string): T {
  const s = dailySeed()+':'+seed
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return pool[h % pool.length]
}

export function routeRequest(message: string): RouteDecision {
  const m = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

  // Görsel — en öncelikli, çünkü "çiz" kelimesi genel metinle karışmasın
  const imageKeywords = [
    "ciz", "cizdir", "resim", "gorsel", "foto", "poster", "logo", "tasarla",
    "afis", "karikatur", "illustration", "canva", "kopek", "kedi", "ejderha",
    "uzay", "manzara", "karakter", "avatar", "wallpaper", "thumbnail",
    "gorselini", "resmini", "cizmeni",
    // İnsan — doğrudan tetikle (şehir yerine insan)
    "insan", "adam", "kadin", "kadın", "erkek", "cocuk", "çocuk", "kisi", "kişi",
    "portre", "selfie", "yuz", "yüz", "face", "human", "person",
  ]
  if (hasAny(m, imageKeywords)) {
    return {
      agent: "image",
      provider: "pollinations",
      model: "flux",
      reason: "Görsel üretimi",
      task: "gorsel",
    }
  }

  // Kod — OpenAI birincil, DeepSeek/NVIDIA/Groq yedek (her biri ayrı anahtar seti)
  const codeKeywords = [
    "kod", "kodla", "yazilim", "program", "python", "javascript", "typescript",
    "react", "next.js", "nextjs", "html", "css", "sql", "api", "fonksiyon",
    "debug", "hata ayikla", "script", "proje", "kutuphane", "tailwind",
    "supabase", "vercel", "node", "npm", "component", "hook",
  ]
  if (hasAny(m, codeKeywords)) {
    // Görev dağılımı: openai → deepseek → nvidia → groq → openrouter → kimi → huggingface → google
    const pool: Array<{ provider: ProviderId; model: string }> = [
      { provider: "deepseek", model: "deepseek-chat" },
      { provider: "deepseek", model: "deepseek-reasoner" },
      { provider: "kimi", model: "moonshot-v1-8k" },
      { provider: "kimi", model: "moonshot-v1-32k" },
      { provider: "nvidia", model: "nvidia/llama-3.3-nemotron-super-49b-v1" },
      { provider: "nvidia", model: "nvidia/llama-3.1-nemotron-70b-instruct" },
      { provider: "groq", model: "openai/gpt-oss-120b" },
      { provider: "openai", model: "gpt-4o-mini" },
      { provider: "openrouter", model: "anthropic/claude-sonnet-5.5" },
    ]
    const pick = pickRotated(pool, m)
    return {
      agent: "code",
      provider: pick.provider,
      model: pick.model,
      reason: `Kod üretimi`,
      task: "kod",
    }
  }

  // Yazı / Döküman / Slayt — Google birincil, OpenAI yedek
  const docKeywords = [
    "dokuman", "döküman", "belge", "yazi", "yazı", "makale", "rapor", "odev", "ödev",
    "slayt", "sunum", "presentation", "slide", "google docs", "docs", "word", "pdf hazirla",
    "icerik yaz", "metin yaz", "blog", "kompozisyon", "ozet cikar", "duzenle"
  ]
  if (hasAny(m, docKeywords)) {
    const pool: Array<{ provider: ProviderId; model: string }> = [
      { provider: "google", model: "gemini-3.8-flash" },
      { provider: "openai", model: "gpt-4o-mini" },
      { provider: "openai", model: "gpt-4o" },
      { provider: "google", model: "gemini-3.8-flash-lite" },
    ]
    const pick = pickRotated(pool, m)
    return {
      agent: "text",
      provider: pick.provider,
      model: pick.model,
      reason: `Döküman`,
      task: "dokuman",
    }
  }

  // Akıl / ağır mantık — DeepSeek birincil, NVIDIA yedek (Görev 3)
  const reasoningKeywords = [
    "dusunu", "dusun", "mantik", "hesapla", "problem", "coz", "analiz",
    "adim adim", "step by step", "neden", "nicin", "kanitla", "acikla",
    "matematik", "fizik", "kimya", "muhtemel", "olasilik", "agir mantik", "zor soru",
  ]
  if (hasAny(m, reasoningKeywords) && m.length > 20) {
    const pool: Array<{ provider: ProviderId; model: string }> = [
      { provider: "deepseek", model: "deepseek-reasoner" },
      { provider: "nvidia", model: "nvidia/llama-3.3-nemotron-super-49b-v1" },
      { provider: "nvidia", model: "nvidia/llama-3.1-nemotron-70b-instruct" },
      { provider: "deepseek", model: "deepseek-chat" },
    ]
    const pick = pickRotated(pool, m)
    return {
      agent: "reasoning",
      provider: pick.provider,
      model: pick.model,
      reason: `Mantık`,
      task: "akıl",
    }
  }

  // Arama / güncel — Groq birincil, Google/OpenRouter yedek
  const searchKeywords = [
    "ara", "arastir", "guncel", "haber", "fiyat", "bugun", "2025", "2026",
    "nedir", "kimdir", "nerede", "nasil alinir", "hava durumu", "doviz",
    "borsa", "son dakika", "gundem",
  ]
  if (hasAny(m, searchKeywords) || m.startsWith("ara ") || m.includes(" web ")) {
    const pool: Array<{ provider: ProviderId; model: string }> = [
      { provider: "groq", model: "openai/gpt-oss-120b" },
      { provider: "groq", model: "openai/gpt-oss-20b" },
      { provider: "google", model: "gemini-3.8-flash" },
      { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct:free" },
    ]
    const pick = pickRotated(pool, m)
    return {
      agent: "search",
      provider: pick.provider,
      model: pick.model,
      reason: `Arama`,
      task: "arama",
    }
  }

  // Çeviri — Google birincil, KIMI/OpenAI yedek
  if (hasAny(m, ["cevir", "translate", "tercume", "çevir", "ingilizceye", "turkceye", "ozetle", "ozet", "kisa ozet"])) {
    const pool: Array<{ provider: ProviderId; model: string }> = [
      { provider: "google", model: "gemini-3.8-flash" },
      { provider: "kimi", model: "moonshot-v1-8k" },
      { provider: "google", model: "gemini-3.8-flash-lite" },
      { provider: "openai", model: "gpt-4o-mini" },
    ]
    const pick = pickRotated(pool, m)
    return {
      agent: "text",
      provider: pick.provider,
      model: pick.model,
      reason: `Çeviri`,
      task: "çeviri",
    }
  }

  // Genel sohbet — Google birincil, diğerleri yedek
  const genel: Array<{ provider: ProviderId; model: string }> = [
    { provider: "google", model: "gemini-3.8-flash" },
    { provider: "kimi", model: "moonshot-v1-8k" },
    { provider: "openrouter", model: "anthropic/claude-sonnet-5.5" },
    { provider: "nvidia", model: "nvidia/llama-3.3-nemotron-super-49b-v1" },
    { provider: "deepseek", model: "deepseek-chat" },
    { provider: "huggingface", model: "Qwen/Qwen2.5-7B-Instruct" },
  ]
  const g = pickRotated(genel, m)
  return {
    agent: "text",
    provider: g.provider,
    model: g.model,
    reason: `Genel sohbet`,
    task: g.provider === "google" ? "genel" : "genel",
  }
}

// UI'da gösterilecek görev açıklamaları
export const TASK_INFO: Record<string, { label: string; provider: ProviderId; model: string; task?: ModelTask }> = {
  genel: { label: "Genel Sohbet", provider: "google", model: "gemini-3.8-flash", task: "genel" },
  kod: { label: "Kod Yazma", provider: "openai", model: "gpt-4o-mini", task: "kod" },
  gorsel: { label: "Görsel Üretim", provider: "huggingface", model: "black-forest-labs/FLUX.1-schnell", task: "gorsel" },
  akıl: { label: "Derin Düşünme", provider: "deepseek", model: "deepseek-reasoner", task: "akıl" },
  arama: { label: "Web Arama", provider: "groq", model: "openai/gpt-oss-120b", task: "arama" },
  çeviri: { label: "Çeviri/Özet", provider: "google", model: "gemini-3.8-flash", task: "çeviri" },
  dokuman: { label: "Döküman/Slayt", provider: "google", model: "gemini-3.8-flash", task: "dokuman" },
}

/* Çoklu Görev Modüler Orchestration — örn. Satış sitesi */
export interface OrchestrationPlan {
  task: string
  steps: { id: string, agent: string, provider: ProviderId, model: string, description: string }[]
  github?: { repo: string, push: boolean }
  vercel?: { deploy: boolean }
  supabase?: { tables: string[] }
}

export function planComplexTask(prompt: string): OrchestrationPlan | null {
  const m = prompt.toLowerCase()
  if(m.includes("satış") || m.includes("satis") || m.includes("e-ticaret") || m.includes("eticaret") || m.includes("alışveriş") || m.includes("shop") || m.includes("store")) {
    return {
      task: "Satış ve Alışveriş Sitesi",
      steps: [
        { id:"1", agent:"planner", provider:"groq", model:"openai/gpt-oss-120b", description:"Görev dağılımı — ana AI mimariyi planlar" },
        { id:"2", agent:"image", provider:"huggingface", model:"black-forest-labs/FLUX.1-schnell", description:"Ürün fotoğrafları — Hugging Face FLUX ile" },
        { id:"3", agent:"code", provider:"deepseek", model:"deepseek-chat", description:"Kod — DeepSeek ile Next.js + Tailwind iskelet" },
        { id:"4", agent:"text", provider:"openai", model:"gpt-4o", description:"Metinler — OpenAI/Groq ile ürün açıklamaları" },
        { id:"5", agent:"code", provider:"google", model:"gemini-3.8-flash", description:"Metin/çeviri — Google Gemini ile SEO metinleri" },
        { id:"6", agent:"deploy", provider:"groq", model:"openai/gpt-oss-20b", description:"GitHub'a aktar + Vercel publish" },
      ],
      github: { repo: "sucuk-shop", push: true },
      vercel: { deploy: true },
      supabase: { tables: ["products","orders","users"] },
    }
  }
  if(m.includes("uygulama") || m.includes("app yap") || m.includes("modüler")) {
    return {
      task: "Modüler API Çağrıları",
      steps: [
        { id:"1", agent:"planner", provider:"groq", model:"openai/gpt-oss-120b", description:"Görev analizi" },
        { id:"2", agent:"code", provider:"openrouter", model:"anthropic/claude-sonnet-5.5", description:"Kod — Claude" },
        { id:"3", agent:"image", provider:"huggingface", model:"black-forest-labs/FLUX.1-schnell", description:"Görsel — FLUX" },
        { id:"4", agent:"text", provider:"kimi", model:"moonshot-v1-32k", description:"Dokümantasyon — KIMI" },
        { id:"5", agent:"deploy", provider:"nvidia", model:"nvidia/llama-3.3-nemotron-super-49b-v1", description:"Review — NVIDIA" },
      ],
      github: { repo: "sucuk-app", push: true },
      vercel: { deploy: true },
      supabase: { tables: ["app_data"] },
    }
  }
  return null
}

export async function executeOrchestration(plan: OrchestrationPlan, apiCall: (step: any)=>Promise<any>): Promise<any[]> {
  const results = []
  for(const step of plan.steps) {
    const res = await apiCall(step)
    results.push({ step, result: res })
  }
  return results
}
