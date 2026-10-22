import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { webSearch } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { query, limit } = body as { query?: string; limit?: number };
    if (!query) {
      return NextResponse.json({ error: "Sorgu gerekli." }, { status: 400 });
    }
    const results = await webSearch(query, limit ?? 5);
    return NextResponse.json({ ok: true, query, results });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Arama hatası: " + (err?.message ?? String(err)) },
      { status: 500 }
    );
  }
}
