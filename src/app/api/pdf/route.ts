import { NextRequest, NextResponse } from "next/server"
export const dynamic = "force-dynamic"

// Sunucu tarafı PDF üretimi: basit text → pdf via jsPDF (client da yapabilir, burada yedek)
export async function POST(req: NextRequest){
  const { content, title } = await req.json()
  if(!content) return NextResponse.json({ error:"content gerekli" }, { status:400 })
  // Client tarafında jspdf ile üretmek daha doğru — burada düz text döndürüyoruz
  // Gerçek PDF client'ta generate edilecek, API sadece loglama için
  return NextResponse.json({ ok:true, title: title || "Sucuk-Agent Çıktısı", length: content.length })
}
export async function GET(){
  return NextResponse.json({ info:"POST {title, content} ile PDF oluştur — client'ta jspdf kullanılır" })
}
