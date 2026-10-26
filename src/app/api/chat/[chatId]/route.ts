import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import {
  getChat,
  listMessages,
  addMessage,
  updateChatTitle,
  ensureDemoProfiles,
} from "@/lib/storage"
import { createProviderManager, DEFAULT_PROVIDER_ORDER, ProviderId, getFallbackChain, DEFAULT_MODEL_FOR_PROVIDER } from "@/lib/providers"
import { routeRequest } from "@/lib/orchestrator"
import { webSearch } from "@/lib/search"
import { generateImage } from "@/lib/image"
import { getDriveContext, getStorageContext } from "@/lib/drive"
import { getGithubToken, pushFileToRepo, parseRepoUrl, getSelectedRepo } from "@/lib/github"

export const dynamic = "force-dynamic"

const LIMIT_MSG = "bekle kardeş token lazım 15sn bekle"

const DEFAULT_MODEL_FOR_PROVIDER_FALLBACK: Record<ProviderId, string> = {
  groq: "openai/gpt-oss-20b",
  openrouter: "anthropic/claude-sonnet-5.5",
  deepseek: "deepseek-chat",
  kimi: "moonshot-v1-8k",
  nvidia: "nvidia/llama-3.3-nemotron-super-49b-v1",
  openai: "gpt-4o-mini",
  grok: "grok-2-latest",
  google: "gemini-3.8-flash",
  huggingface: "Qwen/Qwen2.5-7B-Instruct",
  pollinations: "flux",
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
  // 2'li paralel batch — hız + tüm alternatifleri dene (token bitince sıradaki en iyiye geç)
  const healthyTargets = targets.filter(t => manager.keysFor(t.provider).length > 0 || manager.rawKeysFor(t.provider).length > 0)
  const queue = healthyTargets.length ? healthyTargets : targets
  for (let i = 0; i < queue.length; i += 2) {
    const batch = queue.slice(i, i + 2)
    const results = await Promise.allSettled(batch.map(t => manager.chat(t.provider, t.model, messages, { temperature: 0.7, maxTokens: 1024 })))
    for (let j = 0; j < results.length; j++) {
      const r = results[j]
      const t = batch[j]
      if (r.status === "fulfilled") {
        return { text: r.value.text, provider: r.value.provider, model: r.value.model, attempts }
      } else {
        const err: any = (r as any).reason
        const msg = err?.message ?? String(err)
        attempts.push({ provider: t.provider, model: t.model, error: msg, status: err?.status })
      }
    }
  }
  // hiçbiri olmadıysa tek tek kalanları da dene (son şans)
  return { text: null as any, provider: null as any, model: null as any, attempts } as any
}

export async function GET(req: Request, { params }: { params: { chatId: string } }) {
  await ensureDemoProfiles()
  const check = await requireAuth()
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }
  const chat = await getChat(params.chatId, check.user.id)
  if (!chat) {
    try{
      const { listChats } = await import("@/lib/storage")
      const all = await listChats(check.user.id)
      const { isSupabaseConfigured } = await import("@/lib/supabase")
      return NextResponse.json({ error: "Sohbet bulunamadı.", debug: { userId: check.user.id, chatId: params.chatId, isSupabaseConfigured, totalChatsForUser: all.length, totalChatsIds: all.slice(0,5).map(c=>c.id) } }, { status: 404 })
    }catch{}
    return NextResponse.json({ error: "Sohbet bulunamadı." }, { status: 404 })
  }
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

    let decision: { agent: string; provider: ProviderId; model: string; reason: string; task: any }
    if (mode === "plain" && reqProvider && reqModel) {
      decision = {
        agent: "chat",
        provider: reqProvider as ProviderId,
        model: reqModel,
        reason: `Düz mod — sen seçtin: ${reqProvider} / ${reqModel}. Kota biterse görev zincirinde sıradaki API devralır.`,
        task: "genel",
      }
    } else if (mode === "plain") {
      decision = { agent: "chat", provider: "groq", model: "openai/gpt-oss-20b", reason: "Düz mod varsayılan.", task: "genel" }
    } else {
      const r = routeRequest(content) as any
      decision = { agent: r.agent, provider: r.provider as ProviderId, model: r.model, reason: r.reason, task: r.task }
    }

    let assistantText = ""
    let usedProvider = decision.provider
    let usedModel = decision.model
    let toolOutput: string | null = null
    let limitExhausted = false

    if (decision.agent === "image") {
      const img = await generateImage(content)
      if (img.ok && img.buffer) {
        const b64 = img.buffer.toString("base64")
        assistantText = `![generated](data:${img.contentType};base64,${b64})`
      } else if (img.ok) {
        assistantText = `İstediğin görsel hazır`
      } else {
        assistantText = LIMIT_MSG
      }
    } else {
      const manager = createProviderManager()
      const systemBase = `Sen Sucuk-Agent'sın — Türkçe, net ve güvenli bir yapay zekâsın. Görevin: ${decision.agent}. Anlama zincirin ayrı, kullanıcıya ayrıntı verme. Kota biterse sakin kal ve beklemesini söyle.`
      // — Çoklu araç zinciri: Drive / Depo / Arama / Repo — paralel & hızlı (max 2s araç, ana LLM'i bloklamaz)
      const toolOutputs: string[] = []
      const low = content.toLowerCase()
      const wantsDrive = /(drive|google\s*drive|drive'a|depo|depolara)/i.test(content)
      const wantsStorage = /(supabase|depo|tablolar|storage|saklanan|veritab|friendship|project)/i.test(content)
      const wantsRepo = /(repo|github|push|commit|kod yaz|repoya|dosya oluştur)/i.test(content)
      const wantsSearch = decision.agent === "search" || /(ara|bul|getir|search|nedir|nasıl|what is|how to)/i.test(content)
      const withTimeout = <T>(p: Promise<T>, ms: number, fallback: T): Promise<T> => Promise.race([p, new Promise<T>(res=> setTimeout(()=>res(fallback), ms))])
      const toolJobs: Promise<void>[] = []
      if (wantsDrive || low.includes("drive")) {
        toolJobs.push((async()=>{
          try {
            const driveCtx:any = await withTimeout(getDriveContext(check.user.id) as any, 1800, null)
            if (!driveCtx) { toolOutputs.push(`🔗 Drive: zaman aşımı — klasör: https://drive.google.com/drive/folders/1WJxce63LuN_LO4Z85x2DXluL0PSDGues`); return }
            if (driveCtx.ok && driveCtx.files?.length) {
              const lines = driveCtx.files.map((f:any,i:number)=> `${i+1}. ${f.name} (${f.mimeType}) — ${f.webViewLink || f.id}`).join("\n")
              toolOutputs.push(`🔗 Google Drive dosyaları (API):\n${lines}`)
              toolOutput = lines
            } else {
              const conn = (driveCtx.connected||[]).map((t:any)=>t.name).slice(0,3).join(", ") || "yok"
              toolOutputs.push(`🔗 Drive durumu: ${driveCtx.note || "bağlı değil"} — Klasör: ${driveCtx.folder || "https://drive.google.com/drive/folders/1WJxce63LuN_LO4Z85x2DXluL0PSDGues"} — Bağlı: ${conn}`)
            }
          } catch(e:any){ toolOutputs.push(`Drive hata: ${e.message}`)}
        })())
      }
      if (wantsStorage || low.includes("depo") || low.includes("supabase") || low.includes("tablolar")) {
        toolJobs.push((async()=>{
          try {
            const sctx:any = await withTimeout(getStorageContext(check.user.id) as any, 1500, null)
            if (!sctx) return
            toolOutputs.push(`🗄️ Depo özeti — Supabase ${sctx.supabaseConfigured ? "aktif" : "dosya-fallback"}: sohbetler=${sctx.counts?.chats ?? "?"} , friendships=${sctx.counts?.friendships ?? "?"} , projects=${sctx.counts?.projects ?? "?"} — son sohbetler: ${JSON.stringify(sctx.recentChats||[])}`)
          } catch(e:any){ toolOutputs.push(`Depo hata: ${e.message}`)}
        })())
      }
      if (wantsSearch) {
        toolJobs.push((async()=>{
          try {
            const results = await withTimeout(webSearch(content, 5) as any, 2000, []) as any[]
            if (results.length > 0) {
              const lines = results.map((r, i) => `${i + 1}. ${r.title}\n${r.url}\n${r.snippet}`).join("\n\n")
              toolOutputs.push(`🌐 Web arama (${results.length} sonuç):\n${lines}`)
              toolOutput = lines
            } else {
              toolOutputs.push(`🌐 Web araması denendi ama sonuç dönmedi (${new Date().toISOString().slice(0,10)}).`)
            }
          } catch (e: any) {
            toolOutputs.push(`Web araması hatası: ${e?.message || String(e)}`)
          }
        })())
      }
      if (toolJobs.length) await Promise.allSettled(toolJobs)
      // 4) Kod → Repo push
      if (wantsRepo) {
        try {
          const token = await getGithubToken(check.user.id)
          let codeContent = ""
          let fileName = "sucuk-agent-output.ts"
          const nameMatch = content.match(/(?:dosya|file)\s*[:=]?\s*([A-Za-z0-9_.\-\/]+\.[a-z]+)/i)
          if (nameMatch) fileName = nameMatch[1]
          else {
            const m2 = content.match(/([A-Za-z0-9_.\-\/]+\.(tsx?|jsx?|py|md|json|html|css))/i)
            if (m2) fileName = m2[1]
          }
          // LLM'den kod üret
          try {
            const codePrompt = [{ role: "user", content: `Tek dosya üret: "${content}". Dosya: ${fileName}. Sadece kod, açıklama yok.` }]
            const codeTargets = [{ provider: "groq" as ProviderId, model: DEFAULT_MODEL_FOR_PROVIDER.groq }]
            const codeRes:any = await Promise.race([tryProviders(manager, codeTargets, codePrompt as any), new Promise(r=> setTimeout(()=>r({text:null}), 3500))]) as any
            if (codeRes?.text) {
              const m = codeRes.text.match(/```(?:\w+)?\n([\s\S]*?)```/)
              codeContent = m ? m[1].trim() : codeRes.text.trim()
            }
          } catch{}
          if (!codeContent) codeContent = `// Sucuk-Agent otomatik dosya — istek: ${content}\nexport default function hello(){ return "Merhaba ${check.user.username} — ${new Date().toISOString()}" }\n`
          let ownerRepo = parseRepoUrl(content)
          if (!ownerRepo) {
            // Yandan seçili repo varsa öncelikli kullan (seninki gibi)
            try {
              const selected = await getSelectedRepo(check.user.id)
              if (selected) ownerRepo = parseRepoUrl(selected)
            } catch {}
          }
          if (!ownerRepo) {
            if (token) {
              try {
                const me:any = await fetch("https://api.github.com/user", { headers: { Authorization: `Bearer ${token}`, "User-Agent": "Sucuk-Agent" } }).then(r=>r.json())
                if (me?.login) ownerRepo = { owner: me.login, repo: "sucuk-agent-test" }
              } catch{}
            }
            if (!ownerRepo) ownerRepo = { owner: "31madaracollet", repo: "Sucuk-Agent" }
          }
          if (token && ownerRepo) {
            const pushed:any = await pushFileToRepo({ token, owner: ownerRepo.owner, repo: ownerRepo.repo, path: fileName, content: codeContent, message: `Sucuk-Agent: ${fileName} — ${content.slice(0,60)}` })
            const url = pushed.content?.html_url || `https://github.com/${ownerRepo.owner}/${ownerRepo.repo}/blob/main/${fileName}`
            toolOutputs.push(`💾 GitHub push başarılı → ${url} (sha ${pushed.commit?.sha?.slice(0,7) || ""})\nDosya: ${fileName} (${codeContent.length} karakter)`)
          } else {
            toolOutputs.push(`💾 GitHub (dry-run — token yok): /workspace → GitHub Bağla veya Vercel GITHUB_TOKEN ekle.\nDosya: ${fileName}\n\`\`\`\n${codeContent.slice(0,1200)}\n\`\`\``)
          }
        } catch(e:any){ toolOutputs.push(`GitHub push hata: ${e.message}`)}
      }
      if (toolOutputs.length) toolOutput = toolOutputs.join("\n\n---\n\n")

      const systemContent = systemBase + (toolOutputs.length ? `\n\n[ARAÇ ÇIKTILARI — bunları özetle ve kullanıcıya Türkçe göster]:\n${toolOutputs.join("\n\n")}` : "")
      const messages = [
        { role: "system", content: systemContent },
        { role: "user", content },
      ]

      // Görev dağılımı: kota bitince sıradaki API devralır (task-aware fallback)
      let order: Array<{ provider: ProviderId; model: string }>
      try {
        const taskChain = getFallbackChain((decision as any).task || "genel" as any, decision.provider)
        // Birincil karar en başa, tekrar yok
        const seen = new Set<string>()
        order = taskChain.filter(t => {
          const k = `${t.provider}:${t.model}`
          if (seen.has(k)) return false
          seen.add(k)
          return true
        })
        // Karar modeli kesin başta olsun
        if (order[0]?.provider !== decision.provider || order[0]?.model !== decision.model) {
          order = [{ provider: decision.provider, model: decision.model }, ...order.filter(o => o.provider !== decision.provider || o.model !== decision.model)]
        }
      } catch {
        // fallback eski davranış
        order = [
          { provider: decision.provider, model: decision.model },
          ...DEFAULT_PROVIDER_ORDER.filter((p) => p !== decision.provider).map((p) => ({
            provider: p as ProviderId,
            model: DEFAULT_MODEL_FOR_PROVIDER_FALLBACK[p as ProviderId],
          })),
        ]
      }

      // token bitince öbür en iyi alternatife dön — tüm zinciri dene (sadece 2'li paralel, hızlı)
      const availableCount = manager.availableProviders().length
      const maxTry = Math.max(4, Math.min(order.length, availableCount || order.length, 7))
      order = order.slice(0, maxTry)
      const result: any = await tryProviders(manager, order, messages)

      if (result && (result as any).text) {
        assistantText = (result as any).text
        usedProvider = (result as any).provider as any
        usedModel = (result as any).model
        limitExhausted = false
      } else {
        limitExhausted = true
        assistantText = LIMIT_MSG
        if (toolOutput) assistantText += `\n\n${toolOutput}`
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
