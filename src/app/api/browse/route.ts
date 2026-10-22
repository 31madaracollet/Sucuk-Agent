import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { browseUrl } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { url } = body as { url?: string };
    if (!url) {
      return NextResponse.json({ error: "URL gerekli." }, { status: 400 });
    }
    const result = await browseUrl(url);
    return NextResponse.json({ ok: true, url, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gezinti hatası: " + (err?.message ?? String(err)) },
      { status: 500 }
    );
  }
}
