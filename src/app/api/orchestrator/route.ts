import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { routeRequest } from "@/lib/orchestrator";
import { ensureDemoProfiles } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  await ensureDemoProfiles();
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { message } = body as { message?: string };
    if (!message) {
      return NextResponse.json({ error: "İleti gerekli." }, { status: 400 });
    }
    const decision = routeRequest(message);
    return NextResponse.json({ ok: true, decision });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Yönlendirme hatası: " + (err?.message ?? String(err)) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Orkestratör yönlendirici endpointi." });
}
