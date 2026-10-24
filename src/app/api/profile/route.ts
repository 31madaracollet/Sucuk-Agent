import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function PATCH(req: NextRequest){
  const user = getCurrentUser()
  if(!user) return NextResponse.json({ error:"Giriş gerekli" }, { status:401 })
  const { username } = await req.json()
  if(!username || username.length < 3) return NextResponse.json({ error:"Geçersiz kullanıcı adı" }, { status:400 })
  if(isSupabaseConfigured && supabaseAdmin){
    const { error } = await supabaseAdmin.from("profiles").update({ username }).eq("id", user.id)
    if(error) return NextResponse.json({ error: error.message }, { status:500 })
  }
  // demo fallback zaten cookie'de kullanıcı adı tutulmuyor, ama profil güncelleme için basit yanıt
  return NextResponse.json({ ok:true, username })
}

export async function GET(){
  const user = getCurrentUser()
  if(!user) return NextResponse.json({ error:"Giriş gerekli" }, { status:401 })
  return NextResponse.json({ user })
}
