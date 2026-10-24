import { NextResponse } from "next/server"
import { getCurrentUser, isAdmin, hashPassword } from "@/lib/auth"
import { listProfiles, createProfile, deleteProfile, getProfileByUsername, ensureDemoProfiles } from "@/lib/storage"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = getCurrentUser()
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "Yönetici yetkisi gerekli." }, { status: 403 })
  await ensureDemoProfiles()
  const profiles = await listProfiles()
  return NextResponse.json({ profiles })
}

export async function POST(req: Request) {
  const user = getCurrentUser()
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "Yönetici yetkisi gerekli." }, { status: 403 })
  try {
    const body = await req.json()
    const { username, password, role } = body as { username?: string; password?: string; role?: string }
    if (!username || !password) return NextResponse.json({ error: "Kullanıcı adı ve şifre gerekli." }, { status: 400 })
    if (username.length < 2 || password.length < 3) return NextResponse.json({ error: "Çok kısa." }, { status: 400 })
    const exists = await getProfileByUsername(username)
    if (exists) return NextResponse.json({ error: "Bu kullanıcı zaten var." }, { status: 400 })
    const r = role === "admin" ? "admin" : "user"
    const hash = hashPassword(password)
    const profile = await createProfile(`dyn-${Date.now()}-${username}`, username, r, hash)
    return NextResponse.json({ ok: true, profile }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: Request){
  const user = getCurrentUser()
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "Yönetici yetkisi gerekli." }, { status: 403 })
  const { id, username, role, password } = await req.json()
  if(!id) return NextResponse.json({ error:"id gerekli" }, { status:400 })
  const { supabaseAdmin, isSupabaseConfigured } = await import("@/lib/supabase")
  const updates:any = {}
  if(username) updates.username = username
  if(role) updates.role = role
  if(password) updates.password_hash = hashPassword(password)
  if(Object.keys(updates).length===0) return NextResponse.json({ error:"Güncellenecek alan yok" }, { status:400 })
  if(isSupabaseConfigured && supabaseAdmin){
    const { error } = await supabaseAdmin.from("profiles").update(updates).eq("id", id)
    if(error) return NextResponse.json({ error:error.message }, { status:500 })
  }
  return NextResponse.json({ ok:true })
}

export async function DELETE(req: Request) {
  const user = getCurrentUser()
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "Yönetici yetkisi gerekli." }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 })
  // Koruma: kendi hesabını silmesin + ana adminler
  const me = await getProfileByUsername(user.username)
  if (me && me.id === id) return NextResponse.json({ error: "Kendi hesabını silemezsin." }, { status: 400 })
  if (id.startsWith("demo-admin-001") || id.startsWith("demo-user-001")) {
    return NextResponse.json({ error: "Demo ana hesaplar silinemez." }, { status: 400 })
  }
  await deleteProfile(id)
  return NextResponse.json({ ok: true })
}
