/* ------------------------------------------------------------------ */
/*  Oturum Yönetimi                                                   */
/*  - Sadece Sign-In var (kayıt paneli yok)                            */
/*  - Tanımlı hesaplar: Sucuk9977 (admin), Pirensine (user)            */
/*  - Supabase yapılandırıldıysa Supabase Auth üzerinden, değilse     */
/*    şifreli çerez tabanlı basit demo oturumu kullanılır.             */
/* ------------------------------------------------------------------ */

import { cookies } from "next/headers";
import { getProfileByUsername, createProfile } from "./storage";

const SESSION_NAME = "sucuk_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "geliştirme-anahtari-degistirin";

export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "Sucuk9977";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "SigmaAkif2013";
export const USER_USERNAME = process.env.USER_USERNAME || "Pirensine";
export const USER_PASSWORD = process.env.USER_PASSWORD || "2.0.2.7.F.Z.3102";

export interface SessionUser {
  id: string;
  username: string;
  role: "admin" | "user";
}

const DEMO_USERS: SessionUser[] = [
  { id: "demo-admin-001", username: ADMIN_USERNAME, role: "admin" },
  { id: "demo-user-001", username: USER_USERNAME, role: "user" },
];

function sha256(input: string): string {
  // Node 22'da crypto web standartı mevcuttur.
  const { createHash } = require("crypto");
  return createHash("sha256").update(input + SESSION_SECRET).digest("hex");
}

export function verifyPassword(username: string, password: string): SessionUser | null {
  const user = DEMO_USERS.find((u) => u.username === username);
  if (!user) return null;

  const expected =
    username === ADMIN_USERNAME
      ? sha256(ADMIN_PASSWORD)
      : username === USER_USERNAME
      ? sha256(USER_PASSWORD)
      : null;
  if (!expected) return null;

  const given = sha256(password);
  return given === expected ? user : null;
}

export async function ensureDemoProfiles() {
  // Varsayılan hesapları veritabanına/profil-store'a tekrarlı olarak koyar.
  for (const u of DEMO_USERS) {
    const existing = await getProfileByUsername(u.username);
    if (!existing) {
      await createProfile(u.id, u.username, u.role);
    }
  }
}

export function createSession(user: SessionUser): string {
  const payload = Buffer.from(
    JSON.stringify({ u: user.username, r: user.role, t: Date.now() })
  ).toString("base64url");
  const sig = require("crypto")
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("hex");
  return `${payload}.${sig}`;
}

export function validateSession(token: string): SessionUser | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const expected = require("crypto")
      .createHmac("sha256", SESSION_SECRET)
      .update(payload)
      .digest("hex");
    if (expected !== sig) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const user = DEMO_USERS.find((u) => u.username === data.u && u.role === data.r);
    return user ?? null;
  } catch {
    return null;
  }
}

export function getSessionCookie(): string | undefined {
  try {
    const store = cookies();
    return store.get(SESSION_NAME)?.value;
  } catch {
    return undefined;
  }
}

export function getCurrentUser(): SessionUser | null {
  const token = getSessionCookie();
  if (!token) return null;
  return validateSession(token);
}

export function isAdmin(user: SessionUser | null): boolean {
  return Boolean(user && user.role === "admin");
}

export function setSessionCookie(value: string, options: { maxAge?: number; path?: string } = {}) {
  // Set-Cookie header döndürülür; API route'larda yanıta eklenir.
  const maxAge = options.maxAge ?? 60 * 60 * 24 * 7;
  return `${SESSION_NAME}=${value}; Path=${options.path ?? "/"}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
