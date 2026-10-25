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
  // arkadaş profillerini ekle - sidebar DM için gerekli
  const { getProfile } = await import("@/lib/storage");
  const enriched = await Promise.all(friendships.map(async f => {
    const otherId = f.userId === user.id ? f.friendId : f.userId;
    const profile = await getProfile(otherId);
    const otherUsername = profile?.username ?? otherId;
    return { ...f, friend: profile ? { id: profile.id, username: profile.username, role: profile.role } : { id: otherId, username: otherUsername }, otherId, otherUsername };
  }));
  return NextResponse.json({ ok: true, friendships: enriched, friends: enriched });
}

export async function POST(req: Request) {
  await ensureDemoProfiles();
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 });
  }

  try {
    const body = await req.json();
    let { friendId, friendUsername, username } = body as { friendId?: string; friendUsername?: string; username?: string };
    let targetId = friendId || friendUsername || username;
    if (!targetId) return NextResponse.json({ error: "Arkadaş kullanıcı adı gerekli." }, { status: 400 });
    targetId = targetId.trim();
    // kullanıcı adı mı ID mi? ID demolar demo- ile başlar, gerçek id'ler - içerir ama kullanıcı adı da olabilir
    const { getProfile, getProfileByUsername } = await import("@/lib/storage");
    let targetProfile = await getProfile(targetId);
    if (!targetProfile) targetProfile = await getProfileByUsername(targetId);
    if (!targetProfile) return NextResponse.json({ error: `"${targetId}" kullanıcısı bulunamadı.` }, { status: 404 });
    if (targetProfile.id === user.id) return NextResponse.json({ error: "Kendini ekleyemezsin." }, { status: 400 });
    // zaten var mı?
    const { listFriendships } = await import("@/lib/storage");
    const existing = await listFriendships(user.id);
    if (existing.some(f => (f.userId===user.id && f.friendId===targetProfile!.id) || (f.userId===targetProfile!.id && f.friendId===user.id))) {
      return NextResponse.json({ error: "Zaten arkadaşsınız veya beklemede." }, { status: 409 });
    }
    const f = await addFriendship(user.id, targetProfile.id);
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
