import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getChat,
  listMessages,
  addMessage,
  updateChatTitle,
  ensureDemoProfiles,
} from "@/lib/storage";
import { createProviderManager, DEFAULT_PROVIDER_ORDER } from "@/lib/providers";
import { routeRequest } from "@/lib/orchestrator";
import { webSearch } from "@/lib/search";
import { generateImage } from "@/lib/image";

export const dynamic = "force-dynamic";

const LIMIT_MSG = "Üzgünüm, limit doldu.";

async function requireAuth() {
  const user = getCurrentUser();
  if (!user) return { error: "Oturum açmalısınız.", status: 401 } as const;
  return { user } as const;
}

/**
 * Bir providers listesini sırayla dener; birinde kota bittiyse sıradakine geçer.
 * Tümleri bittiyse null döner.
 */
async function tryProviders(
  manager: ReturnType<typeof createProviderManager>,
  providers: string[],
  model: string,
  messages: { role: string; content: string }[]
) {
  const lastErrors: string[] = [];
  for (const p of providers) {
    try {
      const llm = await manager.chat(p as any, model, messages, {
        temperature: 0.7,
        maxTokens: 2048,
      });
      return { text: llm.text, provider: llm.provider, model: llm.model };
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      if (msg.startsWith("limit_dolu:")) {
        lastErrors.push(`${p}: kota bitti`);
        continue;
      }
      lastErrors.push(`${p}: ${msg}`);
      continue;
    }
  }
  return null;
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
    const { content, mode = "auto" } = body as {
      content?: string;
      mode?: "auto" | "plain";
    };

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "İçerik gerekli." }, { status: 400 });
    }

    // Kullanıcı mesajını kaydet.
    await addMessage(params.chatId, { chatId: params.chatId, sender: "user", content });

    // Başlık yoksa ilk kelimelerle ayarla.
    if (chat.title === "Yeni Sohbet") {
      await updateChatTitle(params.chatId, content.slice(0, 40));
    }

    // Yönlendirme kararı.
    const decision = mode === "plain"
      ? { agent: "chat", provider: "groq", model: "llama-3.1-70b-versatile", reason: "Düz sohbet modu (kullanıcı seçimi)." }
      : routeRequest(content);

    let assistantText = "";
    let usedProvider = decision.provider;
    let usedModel = decision.model;
    let toolOutput: string | null = null;
    let limitExhausted = false;

    // Görsel üretimi.
    if (decision.agent === "image") {
      const img = await generateImage(content);
      if (img.ok) {
        assistantText = `Aşağıda istediğiniz görsel hazırlandı: "${content}".`;
      } else {
        assistantText = `Görsel üretilemedi: ${img.error}`;
      }
    } else {
      const manager = createProviderManager();
      const systemContent = `Sen Sucuk-Agent'ın ${decision.agent} uzmanısın. Türkçe, net, yardımcı ve güvenli yanıtlar ver. ${
        decision.reason
      }`;

      // Arama ajanı için önce canlı web araması yap, çıktısıyla yanıt üret.
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

      // Önce karar verilen sağlayıcı, sonra sıralı fallback sağlayıcılar.
      const order = [decision.provider, ...DEFAULT_PROVIDER_ORDER.filter((p) => p !== decision.provider)];
      const result = await tryProviders(manager, order, decision.model, messages);

      if (result) {
        assistantText = result.text;
        usedProvider = result.provider;
        usedModel = result.model;
      } else {
        limitExhausted = true;
        assistantText = `${LIMIT_MSG} Tüm sağlayıcıların API anahtarlarının günlük kotası tükendi. Sistem "Düz Sohbet Moduna" geçti, ancak şu anda yanıt üretebilecek aktif API sağlayıcısı yok. Lütfen daha sonra tekrar deneyin.`;
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
