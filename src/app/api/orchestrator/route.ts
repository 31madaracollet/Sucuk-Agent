import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { routeRequest, planComplexTask } from "@/lib/orchestrator";
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
    const message = (body as any).message ?? (body as any).task ?? (body as any).prompt ?? "";
    if (!message) {
      return NextResponse.json({ error: "İleti gerekli." }, { status: 400 });
    }
    const decision = routeRequest(message);
    const plan = planComplexTask(message);
    // Modüler API çağrıları: satış sitesi ise detaylı plan döndür
    if(plan) return NextResponse.json({ ok: true, decision, plan, orchestration: true, steps: plan.steps, message: `${plan.task} için ${plan.steps.length} adımlık orchestration hazır: ` + plan.steps.map(s=>s.description).join(" | ") });
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
