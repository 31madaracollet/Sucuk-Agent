import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createProviderManager } from "@/lib/providers";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = getCurrentUser();
  const manager = createProviderManager();
  return NextResponse.json({
    ok: true,
    authenticated: Boolean(user),
    availableProviders: manager.availableProviders(),
    keyCounts: Object.fromEntries(
      manager.availableProviders().map((p) => [p, manager.keysFor(p).length])
    ),
  });
}
