/* Görsel Üretim Yönergesi (Prompt Guard) — saçma/tutarsız görselleri engelle */
const BANNED_PATTERNS = [
  /\b(nsfw|porn|nude|naked|sex)\b/i,
  /\b(gore|bloodbath|torture)\b/i,
  /\b(random|asdf|sdfsdf|qwerty)\b.{0,8}$/i,
]
const ENHANCEMENTS: Record<string,string> = {
  "köpek": "cute dog, high detail, photorealistic, 8k, professional lighting",
  "kedi": "cute cat, high detail, photorealistic, 8k, studio lighting",
  "uzay": "space theme, cosmic, stars, nebula, cinematic, ultra detailed",
  "poster": "poster design, typography, clean layout, professional",
  "logo": "logo design, minimal, vector, clean, professional branding",
  // İnsan — tek kişi, yüz detaylı (şehir çizmesin diye kesin) — Türkçe + İngilizce
  "insan": "single human person, detailed face, portrait, sharp facial features, natural skin, photorealistic, not a city, not buildings",
  "human": "single human person, detailed face, portrait, sharp facial features, natural skin, photorealistic, not a city, not buildings",
  "person": "single human person, detailed face, portrait, sharp facial features, photorealistic, not a city",
  "people": "group of humans, detailed faces, photorealistic, not a city",
  "adam": "single man, adult male person, detailed face, portrait, photorealistic, not a city",
  "man": "single man, adult male person, detailed face, portrait, photorealistic, not a city",
  "kadin": "single woman, adult female person, detailed face, portrait, photorealistic, not a city",
  "kadın": "single woman, adult female person, detailed face, portrait, photorealistic, not a city",
  "woman": "single woman, adult female person, detailed face, portrait, photorealistic, not a city",
  "erkek": "single man, adult male person, detailed face, portrait, photorealistic, not a city",
  "cocuk": "single child, kid person, cute, detailed face, portrait, photorealistic, not a city",
  "çocuk": "single child, kid person, cute, detailed face, portrait, photorealistic, not a city",
  "child": "single child, kid person, cute, detailed face, portrait, photorealistic, not a city",
  "kisi": "single human person, detailed face, portrait, photorealistic, not a city",
  "kişi": "single human person, detailed face, portrait, photorealistic, not a city",
  "portre": "human portrait, single person, detailed face, sharp focus, photorealistic",
  "portrait": "human portrait, single person, detailed face, sharp focus, photorealistic",
  "selfie": "human selfie portrait, single person, detailed face, photorealistic",
  "yuz": "human face close-up, detailed facial features, photorealistic, not a city",
  "yüz": "human face close-up, detailed facial features, photorealistic, not a city",
  "face": "human face close-up, detailed facial features, photorealistic, not a city",
}

export function sanitizeImagePrompt(raw: string): { allowed: boolean, prompt: string, reason?: string } {
  const prompt = raw.trim().slice(0, 600)
  if(!prompt || prompt.length < 3) return { allowed:false, prompt, reason:"Prompt çok kısa" }
  for(const pat of BANNED_PATTERNS){
    if(pat.test(prompt)) return { allowed:false, prompt, reason:"Yasaklı içerik" }
  }
  // Tutarsız tekrarları temizle
  let enhanced = prompt
  const lower = prompt.toLowerCase()
  for(const [k,v] of Object.entries(ENHANCEMENTS)){
    if(lower.includes(k)) enhanced += ", " + v
  }
  // En az 2 kelime olmalı
  if(enhanced.split(/\s+/).length < 2) enhanced += ", high quality, detailed"
  // Max 500 char
  enhanced = enhanced.slice(0, 500)
  return { allowed:true, prompt: enhanced }
}

export function getStockImageFallback(prompt: string): string {
  // Görsel token bittiğinde internetten stok görsel — insan ise insan sorgusu, değilse genel
  const lower = prompt.toLowerCase()
  const isHuman = ["insan","human","person","adam","kadin","kadın","erkek","cocuk","çocuk","portre","selfie","yuz","yüz"].some(k=> lower.includes(k))
  // İnsan promptunda picsum (rastgele şehir) en son denensin, önce keyword'lu kaynaklar
  const seed = encodeURIComponent(prompt.slice(0,40) || "sucuk-agent")
  if (isHuman) {
    // İnsan için keyword'lu kaynaklar önce (şehir değil insan)
    return `https://loremflickr.com/1024/1024/human,person,portrait` // loremflickr keyword öncelikli
  }
  const fallbacks = [
    `https://loremflickr.com/1024/1024/${seed}`,
    `https://source.unsplash.com/1024x1024/?${seed}`,
    `https://picsum.photos/seed/${seed}/1024/1024`,
  ]
  // Deterministik: prompt hash'e göre seç ama artık picsum en son ihtimal
  let hash=0; for(let i=0;i<prompt.length;i++) hash = (hash*31 + prompt.charCodeAt(i)) % fallbacks.length
  return fallbacks[hash]
}

// İnsan sorgusu mu kontrol (sidebar stok için de kullanılır)
export function isHumanPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase()
  return ["insan","human","person","adam","kadin","kadın","erkek","cocuk","çocuk","kisi","kişi","portre","selfie","yuz","yüz","face"].some(k=> lower.includes(k))
}
