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
    // Beleş öncelik: Groq 120B, yoksa OR Claude
    return {
      agent: "code",
      provider: "groq",
      model: "openai/gpt-oss-120b",
      reason: "Kod görevi — GPT-OSS 120B (Groq, beleş) ile yazılıyor. Yedek: Claude Sonnet 5.5 / Qwen Coder",
    }
  }

  // Akıl / reasoning
  const reasoningKeywords = [
    "dusunu", "dusun", "mantik", "hesapla", "problem", "coz", "analiz",
    "adim adim", "step by step", "neden", "nicin", "kanitla", "acikla",
    "matematik", "fizik", "kimya", "muhtemel", "olasilik",
  ]
  if (hasAny(m, reasoningKeywords) && m.length > 30) {
    return {
      agent: "reasoning",
      provider: "deepseek",
      model: "deepseek-reasoner",
      reason: "Derin akıl yürütme — DeepSeek Reasoner ile adım adım çözülüyor. Yedek: Nemotron 49B",
    }
  }

  // Arama / güncel
  const searchKeywords = [
    "ara", "arastir", "guncel", "haber", "fiyat", "bugun", "2025", "2026",
    "nedir", "kimdir", "nerede", "nasil alinir", "hava durumu", "doviz",
    "borsa", "son dakika", "gundem",
  ]
  // Kısa sorular da aramaya gidebilir
  if (hasAny(m, searchKeywords) || m.startsWith("ara ") || m.includes(" web ")) {
    return {
      agent: "search",
      provider: "groq",
      model: "openai/gpt-oss-120b",
      reason: "Web arama gerekti — Groq + DuckDuckGo ile güncel bilgi toplanıp özetleniyor",
    }
  }

  // Çeviri / özet
  if (hasAny(m, ["cevir", "translate", "ozetle", "ozet", "kisa ozet"])) {
    return {
      agent: "text",
      provider: "google",
      model: "gemini-3.8-flash",
      reason: "Çeviri/özet — Gemini 3.8 Flash (hızlı, beleş) ile işleniyor",
    }
  }

  // Varsayılan genel sohbet — en beleş ve dengeli
  // Kısa mesaj -> Groq 20B, uzun -> Gemini
  if (m.length < 80) {
    return {
      agent: "text",
      provider: "groq",
      model: "openai/gpt-oss-20b",
      reason: "Genel sohbet — GPT-OSS 20B (Groq, beleş/çok hızlı) seçildi",
    }
  }
  return {
    agent: "text",
    provider: "google",
    model: "gemini-3.8-flash",
    reason: "Genel sohbet — Gemini 3.8 Flash (beleş, dengeli) seçildi. Yedek: Qwen 2.5 7B",
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
