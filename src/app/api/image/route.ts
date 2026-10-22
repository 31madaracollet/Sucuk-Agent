import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateImage } from "@/lib/image";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { prompt } = body as { prompt?: string };
    if (!prompt) {
      return NextResponse.json({ error: "İstem (prompt) gerekli." }, { status: 400 });
    }

    const result = await generateImage(prompt);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
    }

    // Buffer'ı base64 olarak istemciye döndür (data URL).
    const base64 = result.buffer!.toString("base64");
    return NextResponse.json({
      ok: true,
      dataUrl: `data:${result.contentType};base64,${base64}`,
      prompt,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "Görsel üretim hatası: " + (err?.message ?? String(err)) },
      { status: 500 }
    );
  }
}
