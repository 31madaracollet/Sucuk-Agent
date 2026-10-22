import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { listAnnouncements, createAnnouncement, ensureDemoProfiles } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureDemoProfiles();
  const announcements = await listAnnouncements();
  return NextResponse.json({ ok: true, announcements });
}

export async function POST(req: Request) {
  await ensureDemoProfiles();
  const user = getCurrentUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Yalnızca yönetici duyuru yayımlayabilir." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, content } = body as { title?: string; content?: string };
    if (!title || !content) {
      return NextResponse.json({ error: "Başlık ve içerik gerekli." }, { status: 400 });
    }
    const a = await createAnnouncement(title, content, user.id);
    return NextResponse.json({ ok: true, announcement: a }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "Duyuru yayımlanamadı: " + (err?.message ?? String(err)) }, { status: 500 });
  }
}
