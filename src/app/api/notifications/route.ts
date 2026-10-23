import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { listNotifications, markNotificationRead, markAllNotificationsRead, ensureDemoProfiles } from "@/lib/storage"

export const dynamic = "force-dynamic"

export async function GET() {
  await ensureDemoProfiles()
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })
  const notifications = await listNotifications(user.id)
  return NextResponse.json({ notifications, unread: notifications.filter(n => !n.read).length })
}

export async function POST(req: Request) {
  await ensureDemoProfiles()
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })
  const body = await req.json()
  if (body.all) {
    await markAllNotificationsRead(user.id)
    return NextResponse.json({ ok: true })
  }
  if (body.id) {
    await markNotificationRead(body.id, user.id)
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: "id veya all gerekli" }, { status: 400 })
}

export async function PUT(req: Request) {
  return POST(req)
}
