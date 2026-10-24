import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import {
  getChat,
  listMessages,
  addMessage,
  updateChatTitle,
  ensureDemoProfiles,
} from "@/lib/storage"
import { createProviderManager, DEFAULT_PROVIDER_ORDER, ProviderId } from "@/lib/providers"
import { routeRequest } from "@/lib/orchestrator"
import { webSearch } from "@/lib/search"
import { generateImage } from "@/lib/image"

export const dynamic = "force-dynamic"

const LIMIT_MSG = "Üzgünüm, limit doldu."

const DEFAULT_MODEL_FOR_PROVIDER: Record<ProviderId, string> = {
  groq: "openai/gpt-oss-20b",
  openrouter: "anthropic/claude-sonnet-5.5",
  deepseek: "deepseek-chat",
  kimi: "moonshot-v1-8k",
  nvidia: "nvidia/llama-3.3-nemotron-super-49b-v1",
  openai: "gpt-4o-mini",
  grok: "grok-2-latest",
  google: "gemini-3.8-flash",
  huggingface: "Qwen/Qwen2.5-7B-Instruct",
}

async function requireAuth() {
  const user = getCurrentUser()
  if (!user) return { error: "Oturum açmalısınız.", status: 401 } as const
  return { user } as const
}

async function tryProviders(
  manager: ReturnType<typeof createProviderManager>,
  targets: Array<{ provider: ProviderId; model: string }>,
  messages: { role: string; content: string }[]
) {
  const attempts: Array<{ provider: string; model: string; error: string; status?: number }> = []
  for (const t of targets) {
    try {
      const llm = await manager.chat(t.provider, t.model, messages, { temperature: 0.7, maxTokens: 2048 })
      return { text: llm.text, provider: llm.provider, model: llm.model, attempts }
    } catch (err: any) {
      const msg = err?.message ?? String(err)
      attempts.push({ provider: t.provider, model: t.model, error: msg, status: (err as any)?.status })
      continue
    }
  }
  return { text: null as any, provider: null as any, model: null as any, attempts } as any
}

export async function GET(req: Request, { params }: { params: { chatId: string } }) {
  await ensureDemoProfiles()
  const check = await requireAuth()
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }
  const chat = await getChat(params.chatId, check.user.id)
  if (!chat) return NextResponse.json({ error: "Sohbet bulunamadı." }, { status: 404 })
  const messages = await listMessages(params.chatId)
  return NextResponse.json({ chat, messages })
}

export async function POST(req: Request, { params }: { params: { chatId: string } }) {
  await ensureDemoProfiles()
  const check = await requireAuth()
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status })
  const chat = await getChat(params.chatId, check.user.id)
  if (!chat) return NextResponse.json({ error: "Sohbet bulunamadı." }, { status: 404 })

  try {
    const body = await req.json()
    const { content, mode = "auto", provider: reqProvider, model: reqModel } = body as {
      content?: string
      mode?: "auto" | "plain"
      provider?: string
      model?: string
    }
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "İçerik gerekli." }, { status: 400 })
    }

    await addMessage(params.chatId, { chatId: params.chatId, sender: "user", content })
    if (chat.title === "Yeni Sohbet") {
      await updateChatTitle(params.chatId, content.slice(0, 40))
    }

    let decision: { agent: string; provider: ProviderId; model: string; reason: string }
    if (mode === "plain" && reqProvider && reqModel) {
      decision = {
        agent: "chat",
        provider: reqProvider as ProviderId,
        model: reqModel,
        reason: `Düz mod — sen seçtin: ${reqProvider} / ${reqModel}. Kota biterse sıradaki beleş modele geçer.`,
      }
    } else if (mode === "plain") {
      decision = { agent: "chat", provider: "groq", model: "openai/gpt-oss-20b", reason: "Düz mod varsayılan." }
    } else {
      const r = routeRequest(content)
      decision = { agent: r.agent, provider: r.provider as ProviderId, model: r.model, reason: r.reason }
    }

    let assistantText = ""
    let usedProvider = decision.provider
    let usedModel = decision.model
    let toolOutput: string | null = null
    let limitExhausted = false

    if (decision.agent === "image") {
      const img = await generateImage(content)
      if (img.ok && img.buffer) {
        // Base64 olarak döndür ki UI gösterebilsin
        const b64 = img.buffer.toString("base64")
        assistantText = `![generated](data:${img.contentType};base64,${b64})\n\n“${content}” için görsel üretildi — FLUX.1 Schnell (beleş, Hugging Face).`
      } else if (img.ok) {
        assistantText = `İstediğin görsel hazır: "${content}"`
      } else {
        assistantText = `Görsel üretilemedi: ${img.error} — /api/debug'den Hugging Face anahtarını kontrol et.`
      }
    } else {
      const manager = createProviderManager()
      const systemContent = `Sen Sucuk-Agent'sın — siyah-beyaz premium cihaz temasıyla çalışan, Türkçe, net ve güvenli bir yapay zekâsın. Görevin: ${decision.agent}. ${decision.reason}. Beleş modellere öncelik ver, kota biterse sakin kal ve alternatif öner.`

      if (decision.agent === "search") {
        const results = await webSearch(content, 5)
        if (results.length > 0) {
          toolOutput = results.map((r, i) => `${i + 1}. ${r.title}\n${r.url}\n${r.snippet}`).join("\n\n")
        }
      }

      const messages = [
        { role: "system", content: systemContent + (toolOutput ? `\n\nWeb arama çıktıları:\n${toolOutput}` : "") },
        { role: "user", content },
      ]

      // Akıllı sırayla dene: önce karar, sonra beleş öncelikli yedekler
      const order: Array<{ provider: ProviderId; model: string }> = [
        { provider: decision.provider, model: decision.model },
        ...DEFAULT_PROVIDER_ORDER.filter((p) => p !== decision.provider).map((p) => ({
          provider: p as ProviderId,
          model: DEFAULT_MODEL_FOR_PROVIDER[p as ProviderId],
        })),
      ]

      const result: any = await tryProviders(manager, order, messages)

      if (result && (result as any).text) {
        assistantText = (result as any).text
        usedProvider = (result as any).provider as any
        usedModel = (result as any).model
        limitExhausted = false
      } else {
        limitExhausted = true
        const debug = ((result as any)?.attempts ?? []).map((a: any) => `${a.provider}/${a.model}: ${a.error}`).join(" | ")
        assistantText = `${LIMIT_MSG} Tüm sağlayıcılar kota dolu/hatalı. Teşhis: ${debug}. Ayarlar → sağlayıcı durumuna bak veya Düz modda beleş model dene.`
      }
    }

    await addMessage(params.chatId, {
      chatId: params.chatId,
      sender: "assistant",
      content: assistantText,
      provider: usedProvider,
      model: usedModel,
    })

    return NextResponse.json({
      ok: true,
      decision,
      usedProvider,
      usedModel,
      assistant: assistantText,
      toolOutput,
      limitExhausted,
    })
  } catch (err: any) {
    return NextResponse.json({ error: "Yanıt üretilemedi: " + (err?.message ?? String(err)) }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { chatId: string } }) {
  await ensureDemoProfiles()
  const check = await requireAuth()
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status })
  const url = new URL(req.url)
  const messageId = url.searchParams.get("messageId")
  if (messageId) {
    const { deleteMessage } = await import("@/lib/storage")
    const ok = await deleteMessage(params.chatId, messageId, check.user.id)
    if (!ok) return NextResponse.json({ error: "Mesaj silinemedi (yetki yok veya bulunamadı)" }, { status: 403 })
    return NextResponse.json({ ok: true, deleted: messageId, driveSync: "Drive yedekte de silinecek (oto senkron)" })
  }
  const { deleteChat } = await import("@/lib/storage")
  await deleteChat(params.chatId, check.user.id)
  return NextResponse.json({ ok: true })
}
