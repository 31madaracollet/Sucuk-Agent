import { NextResponse } from "next/server"
import { cleanupOldChats } from "@/lib/storage"
export const dynamic = "force-dynamic"
// Vercel Cron veya manuel çağrı: 1 haftadır kullanılmayan sohbetleri sil (admin hariç)
export async function POST(){
  const result = await cleanupOldChats()
  return NextResponse.json({ ok:true, ...result, message: `${result.deleted} sohbet silindi, ${result.skippedAdmin} admin korundu` })
}
export async function GET(){
  const result = await cleanupOldChats()
  return NextResponse.json({ ok:true, ...result })
}
