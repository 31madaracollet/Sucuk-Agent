/* ------------------------------------------------------------------ */
/*  Orkestratör Yönlendirici                                           */
/*  Kullanıcı isteğini analiz ederek hangi ajana/modele gidileceğini  */
/*  belirler. Gerçek bir LLM çağrısı yapılmayacağına karar verildiyse  */
/*  kural tabanlı bir yönlendirme yapılır.                             */
/* ------------------------------------------------------------------ */

import type { ProviderId, RouteDecision } from "@/types";

export function routeRequest(message: string): RouteDecision {
  const m = message.toLowerCase();

  const codeKeywords = [
    "kod", "kodla", "yazılım", "program", "python", "javascript", "react",
    "next.js", "html", "css", "sql", "api", "fonksiyon", "hata ayıkla",
    "debug", "script", "proje", "kütüphane",
  ];
  const imageKeywords = ["görsel", "çiz", "resim", "imaj", "fotoğraf", "tasarla", "logo", "poster"];
  const searchKeywords = ["ara", "arama", "web", "güncel", "haber", "fiyat", "nerede", "nasıl", "nedir"];
  const reasoningKeywords = [
    "mantık", "düşün", "hesapla", "problem", "çözüm", "analiz", "adım adım",
    "mantıklı", "nereden", "niçin", "nasıl olur",
  ];

  let agent: RouteDecision["agent"] = "text";
  let provider: ProviderId = "groq";
  let model = "llama-3.1-70b-versatile";
  let reason = "Genel metin sohbeti.";

  if (imageKeywords.some((k) => m.includes(k))) {
    agent = "image";
    provider = "huggingface";
    model = "stabilityai/stable-diffusion-xl-base-1.0";
    reason = "Görsel üretim talebi algılandı → Hugging Face Stable Diffusion XL.";
  } else if (codeKeywords.some((k) => m.includes(k))) {
    agent = "code";
    provider = "openrouter";
    model = "anthropic/claude-3-opus";
    reason = "Kod yazma / yazılım talebi → OpenRouter üzerinden Claude 3 Opus.";
  } else if (reasoningKeywords.some((k) => m.includes(k))) {
    agent = "reasoning";
    provider = "deepseek";
    model = "deepseek-reasoner";
    reason = "Karmaşık neden-sonuç / analiz talebi → DeepSeek Reasoner.";
  } else if (searchKeywords.some((k) => m.includes(k))) {
    agent = "search";
    provider = "groq";
    model = "llama-3.1-70b-versatile";
    reason = "Canlı web arama gerektirebilecek sorgu → Grok? yok, Groq üzerinden canlı arama destekli yanıt.";
  } else {
    reason = "Düz sohbet / genel soru.";
  }

  return { agent, provider, model, reason };
}
