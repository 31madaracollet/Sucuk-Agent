import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createProviderManager, TASK_DISTRIBUTION } from "@/lib/providers";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = getCurrentUser();
  const manager = createProviderManager();
  const keyHealth = manager.getKeyHealth();
  return NextResponse.json({
    ok: true,
    authenticated: Boolean(user),
    availableProviders: manager.availableProviders(),
    keyCounts: Object.fromEntries(
      manager.availableProviders().map((p) => [p, manager.keysFor(p).length])
    ),
    keyHealth,
    taskDistribution: TASK_DISTRIBUTION,
    note: "Görev dağılımı: her API ayrı görev — kota bitince sıradaki API otomatik devralır (key rotation + provider fallback). Örneğin kod→ openai biterse deepseek, o biterse nvidia...",
  });
}
