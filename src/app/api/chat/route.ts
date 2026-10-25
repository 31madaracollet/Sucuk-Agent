import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { listChats, createChat, ensureDemoProfiles } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureDemoProfiles();
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);
  const chats = await listChats(user.id);
  return NextResponse.json({ chats: chats.slice(0, limit) });
}

export async function POST(req: Request) {
  await ensureDemoProfiles();
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, restoreId, id: restoreId2 } = body as { title?: string; restoreId?: string; id?: string };
    const rid = restoreId || restoreId2;
    const chat = await createChat(user.id, title || "Yeni Sohbet", rid);
    return NextResponse.json({ ok: true, chat }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "Sohbet oluşturulamadı: " + (err?.message ?? String(err)) }, { status: 500 });
  }
}
