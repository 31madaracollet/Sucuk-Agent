import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  listFriendships,
  addFriendship,
  acceptFriendship,
  ensureDemoProfiles,
} from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureDemoProfiles();
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 });
  }
  const friendships = await listFriendships(user.id);
  return NextResponse.json({ ok: true, friendships });
}

export async function POST(req: Request) {
  await ensureDemoProfiles();
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { friendId } = body as { friendId?: string };
    if (!friendId || friendId === user.id) {
      return NextResponse.json({ error: "Geçersiz arkadaş ID." }, { status: 400 });
    }
    const f = await addFriendship(user.id, friendId);
    return NextResponse.json({ ok: true, friendship: f }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "Arkadaş eklenemedi: " + (err?.message ?? String(err)) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  await ensureDemoProfiles();
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body as { id?: string };
    if (!id) {
      return NextResponse.json({ error: "Arkadaşlık ID gerekli." }, { status: 400 });
    }
    await acceptFriendship(id, user.id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Onaylanamadı: " + (err?.message ?? String(err)) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  // Alias for PATCH — frontend sometimes uses PUT
  return PATCH(req);
}
