import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  listDirectMessages,
  addDirectMessage,
  ensureDemoProfiles,
} from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureDemoProfiles();
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const otherId = searchParams.get("otherId");
  if (!otherId) {
    return NextResponse.json({ error: "otherId gerekli." }, { status: 400 });
  }

  const messages = await listDirectMessages(user.id, otherId);
  return NextResponse.json({ ok: true, messages });
}

export async function POST(req: Request) {
  await ensureDemoProfiles();
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { receiverId, content } = body as { receiverId?: string; content?: string };
    if (!receiverId || !content) {
      return NextResponse.json({ error: "Alıcı ve içerik gerekli." }, { status: 400 });
    }
    const m = await addDirectMessage(user.id, receiverId, content);
    return NextResponse.json({ ok: true, message: m }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "İleti gönderilemedi: " + (err?.message ?? String(err)) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  await ensureDemoProfiles();
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get("messageId");
  if (!messageId) return NextResponse.json({ error: "messageId gerekli" }, { status: 400 });
  const { deleteDirectMessage } = await import("@/lib/storage");
  const ok = await deleteDirectMessage(messageId, user.id);
  if (!ok) return NextResponse.json({ error: "Silinemedi" }, { status: 403 });
  return NextResponse.json({ ok: true, deleted: messageId, driveSync: "Drive yedekte de silinecek" });
}
