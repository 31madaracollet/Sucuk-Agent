/* ------------------------------------------------------------------ */
/*  Oturum Yönetimi — sadece sign-in, kayıt yok                      */
/*  Varsayılan: Sucuk9977/SigmaAkif2013 (admin), Pirensine/2.0.2.7   */
/*  Dinamik kullanıcılar: Supabase / demo store'a eklenir            */
/* ------------------------------------------------------------------ */

import { cookies } from "next/headers"
import { getProfileByUsername, createProfile, getProfileByUsernameWithPassword } from "./storage"

const SESSION_NAME = "sucuk_session"
const SESSION_SECRET = process.env.SESSION_SECRET || "geliştirme-anahtari-degistirin"

export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "Sucuk9977"
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "SigmaAkif2013"
export const USER_USERNAME = process.env.USER_USERNAME || "Pirensine"
export const USER_PASSWORD = process.env.USER_PASSWORD || "2.0.2.7.F.Z.3102"

export interface SessionUser {
  id: string
  username: string
  role: "admin" | "user"
}

const DEMO_USERS: SessionUser[] = [
  { id: "demo-admin-001", username: ADMIN_USERNAME, role: "admin" },
  { id: "demo-user-001", username: USER_USERNAME, role: "user" },
  // Ekstra demo — kullanıcı istediği admin/user atayabilsin diye
  { id: "demo-admin-002", username: "SigmaAkif2013", role: "admin" },
  { id: "demo-user-002", username: "2.0.2.7.F.Z.3102", role: "user" },
]

function sha256(input: string): string {
  const { createHash } = require("crypto")
  return createHash("sha256").update(input + SESSION_SECRET).digest("hex")
}

export function hashPassword(plain: string) {
  return sha256(plain)
}

// Senkron eski yol + dinamik DB kontrolü
export function verifyPasswordSync(username: string, password: string): SessionUser | null {
  const found = DEMO_USERS.find((u) => u.username === username)
  if (found) {
    // Demo kullanıcılar için env şifreleri (admin/user aliasları da destekle)
    let expected: string | null = null
    if (username === ADMIN_USERNAME) expected = sha256(ADMIN_PASSWORD)
    else if (username === USER_USERNAME) expected = sha256(USER_PASSWORD)
    else if (username === "SigmaAkif2013") expected = sha256(ADMIN_PASSWORD)
    else if (username === "2.0.2.7.F.Z.3102") expected = sha256(USER_PASSWORD)
    else {
      // Diğer demo userlar için de aynı mantık — her demo kullanıcının şifresi username ile aynı kabul edilmez,
      // env'deki admin/user şifreleri alias olarak çalışır
      return null
    }
    const given = sha256(password)
    if (expected && given === expected) return found
  }
  return null
}

export async function verifyPassword(username: string, password: string): Promise<SessionUser | null> {
  // 1) Demo sabit hesaplar
  const sync = verifyPasswordSync(username, password)
  if (sync) return sync

  // 2) DB'deki dinamik kullanıcılar (password_hash ile)
  try {
    const profile = await getProfileByUsernameWithPassword(username)
    if (profile && (profile as any).password_hash) {
      const given = sha256(password)
      if (given === (profile as any).password_hash) {
        return { id: profile.id, username: profile.username, role: profile.role as any }
      }
    }
  } catch {}
  return null
}

export async function ensureDemoProfiles() {
  for (const u of DEMO_USERS) {
    const existing = await getProfileByUsername(u.username)
    if (!existing) {
      await createProfile(u.id, u.username, u.role)
    }
  }
}

export function createSession(user: SessionUser): string {
  const payload = Buffer.from(
    JSON.stringify({ u: user.username, r: user.role, id: user.id, t: Date.now() })
  ).toString("base64url")
  const sig = require("crypto").createHmac("sha256", SESSION_SECRET).update(payload).digest("hex")
  return `${payload}.${sig}`
}

export function validateSession(token: string): SessionUser | null {
  try {
    const [payload, sig] = token.split(".")
    if (!payload || !sig) return null
    const expected = require("crypto").createHmac("sha256", SESSION_SECRET).update(payload).digest("hex")
    if (expected !== sig) return null
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
    // Artık sadece payload'a güveniyoruz — dinamik kullanıcılar da geçerli
    if (!data.u || !data.r) return null
    return { id: data.id || `dyn-${data.u}`, username: data.u, role: data.r }
  } catch {
    return null
  }
}

export function getSessionCookie(): string | undefined {
  try {
    const store = cookies()
    return store.get(SESSION_NAME)?.value
  } catch {
    return undefined
  }
}

export function getCurrentUser(): SessionUser | null {
  const token = getSessionCookie()
  if (!token) return null
  return validateSession(token)
}

export function isAdmin(user: SessionUser | null): boolean {
  return Boolean(user && user.role === "admin")
}

export function getCurrentUserFromRequest(req: { cookies: { get: (name: string) => { value: string } | undefined } }): SessionUser | null {
  try {
    const token = req.cookies.get(SESSION_NAME)?.value
    if (!token) return null
    return validateSession(token)
  } catch { return null }
}

export function setSessionCookie(value: string, options: { maxAge?: number; path?: string } = {}) {
  const maxAge = options.maxAge ?? 60 * 60 * 24 * 7
  return `${SESSION_NAME}=${value}; Path=${options.path ?? "/"}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`
}

export function clearSessionCookie(): string {
  return `${SESSION_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}
