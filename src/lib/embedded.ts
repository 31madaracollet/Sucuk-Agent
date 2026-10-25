// Kodun içine gömülü kalıcı hesaplar — kullanıcıya özel, istek üzerine
// Eğer Supabase yoksa ve Vercel file-store silinirse bile bu harita devreye girer.
// Kullanım: HARDCODED_BINDINGS[userId] = { githubToken, googleAccessToken, ... }
// Env ile de beslenebilir: EMBEDDED_GITHUB_TOKEN_demo-admin-001 gibi
// Şu an boş — admin doldurdukça hep o hesaba özel kalır (per-user, karışmaz).

export const HARDCODED_BINDINGS: Record<string, {
  githubToken?: string
  githubLogin?: string
  googleAccessToken?: string
  googleRefreshToken?: string
  googleEmail?: string
}> = {
  // Örnek (yorumda) — gerçek tokenleri buraya veya Vercel Env'e ekle:
  // "demo-admin-001": { githubToken: process.env.EMBEDDED_GITHUB_TOKEN_SUCUK9977 || "", githubLogin: "31madaracollet" },
  // "demo-user-001": { googleAccessToken: process.env.EMBEDDED_GOOGLE_TOKEN_PIRENSINE || "", googleEmail: "pirensine@gmail.com" },
}

export function getEmbeddedGithubToken(userId: string): string | null {
  const byId = HARDCODED_BINDINGS[userId]?.githubToken
  if (byId) return byId
  // Env fallback per-user (Vercel → EMBEDDED_GITHUB_TOKEN_<USERID>)
  const envKey = `EMBEDDED_GITHUB_TOKEN_${userId.replace(/[^a-zA-Z0-9]/g, "_")}`
  return (process.env as any)[envKey] || null
}

export function getEmbeddedGoogleToken(userId: string): string | null {
  const byId = HARDCODED_BINDINGS[userId]?.googleAccessToken
  if (byId) return byId
  const envKey = `EMBEDDED_GOOGLE_TOKEN_${userId.replace(/[^a-zA-Z0-9]/g, "_")}`
  return (process.env as any)[envKey] || null
}

export const EMBEDDED_NOTE = "Kod içine gömülü fallback aktif — her site hesabı kendi hardcoded tokeni ile eşleşir, DB silinse bile kaybolmaz."
