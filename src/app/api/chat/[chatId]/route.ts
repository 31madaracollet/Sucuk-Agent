import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getChat,
  listMessages,
  addMessage,
  updateChatTitle,
  ensureDemoProfiles,
} from "@/lib/storage";
import { createProviderManager, DEFAULT_PROVIDER_ORDER, PROVIDER_MODELS, ProviderId } from "@/lib/providers";
import { routeRequest } from "@/lib/orchestrator";
import { webSearch } from "@/lib/search";
import { generateImage } from "@/lib/image";

export const dynamic = "force-dynamic";

const LIMIT_MSG = "Üzgünüm, limit doldu.";

const DEFAULT_MODEL_FOR_PROVIDER: Record<ProviderId, string> = {
  groq: "llama-3.3-70b-versatile",
  openrouter: "anthropic/claude-3.5-sonnet",
  deepseek: "deepseek-chat",
  kimi: "moonshot-v1-8k",
  nvidia: "meta/llama-3.3-70b-instruct",
  openai: "gpt-4o-mini",
  google: "gemini-2.0-flash",
  huggingface: "HuggingFaceH4/zephyr-7b-beta",
};

async function requireAuth() {
  const user = getCurrentUser();
  if (!user) return { error: "Oturum açmalısınız.", status: 401 } as const;
  return { user } as const;
}

async function tryProviders(
  manager: ReturnType<typeof createProviderManager>,
  targets: Array<{ provider: ProviderId; model: string }>,
  messages: { role: string; content: string }[]
) {
  const attempts: Array<{ provider: string; model: string; error: string; status?: number }> = [];
  for (const t of targets) {
    try {
      const llm = await manager.chat(t.provider, t.model, messages, {
        temperature: 0.7,
        maxTokens: 2048,
      });
      return { text: llm.text, provider: llm.provider, model: llm.model, attempts };
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      attempts.push({ provider: t.provider, model: t.model, error: msg, status: (err as any)?.status });
      continue;
    }
  }
  return { text: null as any, provider: null as any, model: null as any, attempts } as any;
}

export async function GET(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  await ensureDemoProfiles();
  const check = await requireAuth();
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const chat = await getChat(params.chatId, check.user.id);
  if (!chat) {
    return NextResponse.json({ error: "Sohbet bulunamadı." }, { status: 404 });
  }

  const messages = await listMessages(params.chatId);
  return NextResponse.json({ chat, messages });
}

export async function POST(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  await ensureDemoProfiles();
  const check = await requireAuth();
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const chat = await getChat(params.chatId, check.user.id);
  if (!chat) {
    return NextResponse.json({ error: "Sohbet bulunamadı." }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { content, mode = "auto", provider: reqProvider, model: reqModel } = body as {
      content?: string;
      mode?: "auto" | "plain";
      provider?: string;
      model?: string;
    };

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "İçerik gerekli." }, { status: 400 });
    }

    await addMessage(params.chatId, { chatId: params.chatId, sender: "user", content });

    if (chat.title === "Yeni Sohbet") {
      await updateChatTitle(params.chatId, content.slice(0, 40));
    }

    let decision: { agent: string; provider: ProviderId; model: string; reason: string };
    if (mode === "plain" && reqProvider && reqModel) {
      decision = {
        agent: "chat",
        provider: reqProvider as ProviderId,
        model: reqModel,
        reason: `Düz sohbet modu — kullanıcı seçimi: ${reqProvider} / ${reqModel}`,
      };
    } else if (mode === "plain") {
      decision = { agent: "chat", provider: "groq", model: "llama-3.3-70b-versatile", reason: "Düz sohbet modu (kullanıcı seçimi)." };
    } else {
      const r = routeRequest(content);
      decision = { agent: r.agent, provider: r.provider as ProviderId, model: r.model, reason: r.reason };
    }

    let assistantText = "";
    let usedProvider = decision.provider;
    let usedModel = decision.model;
    let toolOutput: string | null = null;
    let limitExhausted = false;

    if (decision.agent === "image") {
      const img = await generateImage(content);
      if (img.ok) {
        assistantText = `İstediğin görsel hazır: "${content}"`;
      } else {
        assistantText = `Görsel üretilemedi: ${img.error}`;
      }
    } else {
      const manager = createProviderManager();
      const systemContent = `Sen Sucuk-Agent'ın ${decision.agent} uzmanısın. Türkçe, net, yardımcı ve güvenli yanıtlar ver. ${decision.reason}`;

      if (decision.agent === "search") {
        const results = await webSearch(content, 5);
        if (results.length > 0) {
          toolOutput = results
            .map((r, i) => `${i + 1}. ${r.title}\n${r.url}\n${r.snippet}`)
            .join("\n\n");
        }
      }

      const messages = [
        { role: "system", content: systemContent + (toolOutput ? `\n\nAraç çıktısı:\n${toolOutput}` : "") },
        { role: "user", content },
      ];

      const order: Array<{ provider: ProviderId; model: string }> = [
        { provider: decision.provider, model: decision.model },
        ...DEFAULT_PROVIDER_ORDER.filter((p) => p !== decision.provider).map((p) => ({
          provider: p as ProviderId,
          model: DEFAULT_MODEL_FOR_PROVIDER[p as ProviderId],
        })),
      ];

      const result: any = await tryProviders(manager, order, messages);

      if (result && (result as any).text) {
        assistantText = (result as any).text;
        usedProvider = (result as any).provider as any;
        usedModel = (result as any).model;
        limitExhausted = false;
      } else {
        limitExhausted = true;
        const debug = ((result as any)?.attempts ?? []).map((a: any) => `${a.provider}/${a.model}: ${a.error}`).join(" | ");
        assistantText = `${LIMIT_MSG} Tüm sağlayıcılar başarısız oldu. Teşhis: ${debug} — /api/debug bak.`;
      }
    }

    await addMessage(params.chatId, {
      chatId: params.chatId,
      sender: "assistant",
      content: assistantText,
      provider: usedProvider,
      model: usedModel,
    });

    return NextResponse.json({
      ok: true,
      decision,
      usedProvider,
      usedModel,
      assistant: assistantText,
      toolOutput,
      limitExhausted,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Yanıt üretilemedi: " + (err?.message ?? String(err)) },
      { status: 500 }
    );
  }
}
