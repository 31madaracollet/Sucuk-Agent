import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { listTools, addTool, removeTool, ensureDemoProfiles } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureDemoProfiles();
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 });
  }
  const tools = await listTools();
  return NextResponse.json({ ok: true, tools });
}

export async function POST(req: Request) {
  await ensureDemoProfiles();
  const user = getCurrentUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Yalnızca yönetici araç ekleyebilir." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, description, config } = body as {
      name?: string;
      description?: string;
      config?: any;
    };
    if (!name || !description) {
      return NextResponse.json({ error: "İsim ve açıklama gerekli." }, { status: 400 });
    }

    const tool = await addTool(name, description, config ?? {}, user.id);
    return NextResponse.json({ ok: true, tool }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "Araç eklenemedi: " + (err?.message ?? String(err)) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  await ensureDemoProfiles();
  const user = getCurrentUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Yalnızca yönetici araç kaldırabilir." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Araç ID gerekli." }, { status: 400 });
    }
    await removeTool(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Araç kaldırılamadı: " + (err?.message ?? String(err)) }, { status: 500 });
  }
}
