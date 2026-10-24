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
  // Görsel token bittiğinde internetten stok görsel — Picsum + Unsplash source
  const seed = encodeURIComponent(prompt.slice(0,40) || "sucuk-agent")
  const fallbacks = [
    `https://picsum.photos/seed/${seed}/1024/1024`,
    `https://source.unsplash.com/1024x1024/?${seed}`,
    `https://loremflickr.com/1024/1024/${seed}`,
  ]
  // Deterministik: prompt hash'e göre seç
  let hash=0; for(let i=0;i<prompt.length;i++) hash = (hash*31 + prompt.charCodeAt(i)) % fallbacks.length
  return fallbacks[hash]
}
