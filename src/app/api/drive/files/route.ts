import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDriveContext } from "@/lib/drive"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })
  const ctx:any = await getDriveContext(user.id)
  return NextResponse.json({ ...ctx, ok: ctx.ok ?? true })
}
