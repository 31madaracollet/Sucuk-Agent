/* ------------------------------------------------------------------ */
/*  Orkestratör Yönlendirici — Akıllı görev ataması                  */
/*  Her mesaja bir görev verilir ve beleş modellere öncelik verilir  */
/* ------------------------------------------------------------------ */

import type { ProviderId, RouteDecision } from "@/types"

function hasAny(m: string, arr: string[]) {
  return arr.some((k) => m.includes(k))
}

export function routeRequest(message: string): RouteDecision {
  const m = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

  // Görsel — en öncelikli, çünkü "çiz" kelimesi genel metinle karışmasın
  const imageKeywords = [
    "ciz", "cizdir", "resim", "gorsel", "foto", "poster", "logo", "tasarla",
    "afis", "karikatur", "illustration", "canva", "kopek", "kedi", "ejderha",
    "uzay", "manzara", "karakter", "avatar", "wallpaper", "thumbnail",
    "gorselini", "resmini", "cizmeni",
  ]
  if (hasAny(m, imageKeywords)) {
    return {
      agent: "image",
      provider: "huggingface",
      model: "black-forest-labs/FLUX.1-schnell",
      reason: "Görsel üretim — FLUX.1 Schnell (beleş, hızlı) ile çiziliyor. Örn: 'köpek çiz' → Hugging Face",
    }
  }

  // Kod
  const codeKeywords = [
    "kod", "kodla", "yazilim", "program", "python", "javascript", "typescript",
    "react", "next.js", "nextjs", "html", "css", "sql", "api", "fonksiyon",
    "debug", "hata ayikla", "script", "proje", "kutuphane", "tailwind",
    "supabase", "vercel", "node", "npm", "component", "hook",
  ]
  if (hasAny(m, codeKeywords)) {
    const beleş: Array<{provider: ProviderId, model: string}> = [
      { provider: "deepseek", model: "deepseek-chat" },
      { provider: "kimi", model: "moonshot-v1-8k" },
      { provider: "openrouter", model: "anthropic/claude-sonnet-5.5" },
      { provider: "nvidia", model: "nvidia/llama-3.3-nemotron-super-49b-v1" },
      { provider: "google", model: "gemini-3.8-flash" },
      { provider: "huggingface", model: "Qwen/Qwen2.5-Coder-7B-Instruct" },
    ]
    let h=0; for(let i=0;i<m.length;i++) h=(h*31 + m.charCodeAt(i))>>>0
    const pick=beleş[h % beleş.length]
    return {
      agent: "code",
      provider: pick.provider,
      model: pick.model,
      reason: `Kod görevi — ${pick.provider} / ${pick.model} seçildi (beleş rotasyonu). Yedek: diğer beleşler`,
    }
  }

  // Yazı / Döküman / Slayt hazırlama — Gemini + OpenAI (kullanıcı isteği)
  const docKeywords = [
    "dokuman", "döküman", "belge", "yazi", "yazı", "makale", "rapor", "odev", "ödev",
    "slayt", "sunum", "presentation", "slide", "google docs", "docs", "word", "pdf hazirla",
    "icerik yaz", "metin yaz", "blog", "kompozisyon", "ozet cikar", "duzenle"
  ]
  if (hasAny(m, docKeywords)) {
    const docModels: Array<{provider: ProviderId, model: string}> = [
      { provider: "google", model: "gemini-3.8-flash" },
      { provider: "openai", model: "gpt-4o-mini" },
      { provider: "openai", model: "gpt-4o" },
      { provider: "google", model: "gemini-3.8-flash-lite" },
    ]
    let h=0; for(let i=0;i<m.length;i++) h=(h*31 + m.charCodeAt(i))>>>0
    const pick = docModels[h % docModels.length]
    return {
      agent: "text",
      provider: pick.provider,
      model: pick.model,
      reason: `Döküman/Slayt — ${pick.provider} / ${pick.model} (yazı+Google Docs/Slides, kalıcı bağlantı)`,
    }
  }

  // Akıl / ağır mantık — DeepSeek + NVIDIA (kullanıcı isteği)
  const reasoningKeywords = [
    "dusunu", "dusun", "mantik", "hesapla", "problem", "coz", "analiz",
    "adim adim", "step by step", "neden", "nicin", "kanitla", "acikla",
    "matematik", "fizik", "kimya", "muhtemel", "olasilik", "agir mantik", "zor soru",
  ]
  if (hasAny(m, reasoningKeywords) && m.length > 20) {
    // DeepSeek ve NVIDIA dönüşümlü — ağır mantık
    const heavy: Array<{provider: ProviderId, model: string}> = [
      { provider: "deepseek", model: "deepseek-reasoner" },
      { provider: "nvidia", model: "nvidia/llama-3.3-nemotron-super-49b-v1" },
      { provider: "nvidia", model: "nvidia/llama-3.1-nemotron-70b-instruct" },
      { provider: "deepseek", model: "deepseek-chat" },
    ]
    let h=0; for(let i=0;i<m.length;i++) h=(h*31 + m.charCodeAt(i))>>>0
    const pick = heavy[h % heavy.length]
    return {
      agent: "reasoning",
      provider: pick.provider,
      model: pick.model,
      reason: `Ağır mantık — ${pick.provider} / ${pick.model} (deepseek & nvidia rotasyonu)`,
    }
  }

  // Arama / güncel
  const searchKeywords = [
    "ara", "arastir", "guncel", "haber", "fiyat", "bugun", "2025", "2026",
    "nedir", "kimdir", "nerede", "nasil alinir", "hava durumu", "doviz",
    "borsa", "son dakika", "gundem",
  ]
  // Araştırma — Groq burada olabilir (kullanıcı onay verdi)
  if (hasAny(m, searchKeywords) || m.startsWith("ara ") || m.includes(" web ")) {
    const picks: Array<{provider: ProviderId, model: string}> = [
      { provider: "groq", model: "openai/gpt-oss-120b" },
      { provider: "groq", model: "openai/gpt-oss-20b" },
      { provider: "google", model: "gemini-3.8-flash" },
      { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct:free" },
    ]
    let h=0; for(let i=0;i<m.length;i++) h=(h*31 + m.charCodeAt(i))>>>0
    const pk=picks[h % picks.length]
    return {
      agent: "search",
      provider: pk.provider,
      model: pk.model,
      reason: `Web arama — ${pk.provider} + DuckDuckGo (rotasyon)`,
    }
  }

  // Çeviri — her ne derse desin çevirsin (Görev 1)
  if (hasAny(m, ["cevir", "translate", "tercume", "çevir", "ingilizceye", "turkceye", "ozetle", "ozet", "kisa ozet"])) {
    return {
      agent: "text",
      provider: "google",
      model: "gemini-3.8-flash",
      reason: "Çeviri — Gemini 3.8 Flash (görev 1: her prompt İngilizceye çevrilir, resimde de aktif)",
    }
  }

  // Genel sohbet — kod/söz için Groq yok, araştırma için Groq var
  const genel: Array<{provider: ProviderId, model: string}> = [
    { provider: "google", model: "gemini-3.8-flash" },
    { provider: "kimi", model: "moonshot-v1-8k" },
    { provider: "openrouter", model: "anthropic/claude-sonnet-5.5" },
    { provider: "nvidia", model: "nvidia/llama-3.3-nemotron-super-49b-v1" },
    { provider: "deepseek", model: "deepseek-chat" },
    { provider: "huggingface", model: "Qwen/Qwen2.5-7B-Instruct" },
  ]
  let hh=0; for(let i=0;i<m.length;i++) hh=(hh*31 + m.charCodeAt(i))>>>0
  const g=genel[hh % genel.length]
  return {
    agent: "text",
    provider: g.provider,
    model: g.model,
    reason: `Genel sohbet — ${g.provider} / ${g.model} (rotasyon, beleş)`,
  }
}

// UI'da gösterilecek görev açıklamaları
export const TASK_INFO: Record<string, { label: string; provider: ProviderId; model: string }> = {
  genel: { label: "Genel Sohbet", provider: "groq", model: "openai/gpt-oss-20b" },
  kod: { label: "Kod Yazma", provider: "groq", model: "openai/gpt-oss-120b" },
  gorsel: { label: "Görsel Üretim", provider: "huggingface", model: "black-forest-labs/FLUX.1-schnell" },
  akıl: { label: "Derin Düşünme", provider: "deepseek", model: "deepseek-reasoner" },
  arama: { label: "Web Arama", provider: "groq", model: "openai/gpt-oss-120b" },
  çeviri: { label: "Çeviri/Özet", provider: "google", model: "gemini-3.8-flash" },
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
  // Satış / e-ticaret / alışveriş sitesi tetikleyicileri
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
