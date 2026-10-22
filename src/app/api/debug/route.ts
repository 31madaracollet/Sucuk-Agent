import { NextResponse } from "next/server";
import { createProviderManager, DEFAULT_PROVIDER_ORDER, ProviderId } from "@/lib/providers";

export const dynamic = "force-dynamic";

const DEFAULT_MODEL_FOR_PROVIDER: Record<string, string> = {
  groq: "llama-3.1-70b-versatile",
  openrouter: "anthropic/claude-3-opus",
  deepseek: "deepseek-chat",
  kimi: "moonshot-v1-8k",
  nvidia: "nemotron-4-340b-instruct",
  openai: "gpt-4o-mini",
  google: "gemini-1.5-flash",
  grok: "grok-2-latest",
  huggingface: "HuggingFaceH4/zephyr-7b-beta",
};

export async function GET() {
  const manager = createProviderManager();
  const available = manager.availableProviders();
  const keyCounts: Record<string, number> = {};
  const envPresence: Record<string, boolean> = {};
  const keyPreview: Record<string, string[]> = {};

  // Env var existence check (without leaking full key)
  const PROVIDER_ENV_KEYS: Record<string, string[]> = {
    google: ["GOOGLE_API_KEY_1","GOOGLE_API_KEY_2","GOOGLE_API_KEY_3"],
    openai: ["OPENAI_API_KEY_1","OPENAI_API_KEY_2","OPENAI_API_KEY_3"],
    groq: ["GROQ_API_KEY_1","GROQ_API_KEY_2","GROQ_API_KEY_3"],
    grok: ["GROK_API_KEY_1","GROK_API_KEY_2","GROK_API_KEY_3"],
    openrouter: ["OPENROUTER_API_KEY_1","OPENROUTER_API_KEY_2","OPENROUTER_API_KEY_3"],
    deepseek: ["DEEPSEEK_API_KEY_1","DEEPSEEK_API_KEY_2","DEEPSEEK_API_KEY_3"],
    kimi: ["KIMI_API_KEY_1","KIMI_API_KEY_2","KIMI_API_KEY_3"],
    nvidia: ["NVIDIA_API_KEY_1","NVIDIA_API_KEY_2","NVIDIA_API_KEY_3"],
    huggingface: ["HUGGINGFACE_API_TOKEN"],
  };

  for (const [prov, envs] of Object.entries(PROVIDER_ENV_KEYS)) {
    keyCounts[prov] = manager.keysFor(prov as any).length;
    envPresence[prov+"_env_1"] = Boolean(process.env[envs[0]]);
    // preview: first 8 chars + len
    keyPreview[prov] = manager.keysFor(prov as any).map(k => {
      const v = k.key || "";
      return `${k.index}: ${v.slice(0, 8)}... len=${v.length}`;
    });
  }

  // Try a 1-token test call for each available provider
  const testMessages = [{ role: "user", content: "Merhaba, sadece 'ok' de." }];
  const results: any[] = [];

  for (const prov of DEFAULT_PROVIDER_ORDER) {
    if (!available.includes(prov as any)) {
      results.push({ provider: prov, model: DEFAULT_MODEL_FOR_PROVIDER[prov], skipped: "no_keys", keys: 0 });
      continue;
    }
    const model = DEFAULT_MODEL_FOR_PROVIDER[prov];
    try {
      const llm = await manager.chat(prov as ProviderId, model, testMessages, { temperature: 0.2, maxTokens: 64 });
      results.push({ provider: prov, model, ok: true, text: llm.text.slice(0, 120) });
    } catch (e: any) {
      results.push({ provider: prov, model, ok: false, error: e?.message || String(e), status: (e as any)?.status });
    }
  }

  return NextResponse.json({
    ok: true,
    time: new Date().toISOString(),
    vercelEnv: process.env.VERCEL_ENV || null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0,7) || null,
    availableProviders: available,
    keyCounts,
    keyPreview,
    envPresence,
    testResults: results,
  });
}
