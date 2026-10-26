import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { ensureDemoProfiles } from "@/lib/storage"
import { createProviderManager, getFallbackChain, TASK_DISTRIBUTION } from "@/lib/providers"
import { routeRequest } from "@/lib/orchestrator"
import { webSearch } from "@/lib/search"

export const dynamic = "force-dynamic"

// Bu endpoint SADECE kod + arama modellerini kullanır (kullanıcı isteği: kod yerinde sadece kod/arama iyi modeller)
const ALLOWED_TASKS = ["kod", "arama"] as const

async function tryProviders(
  manager: ReturnType<typeof createProviderManager>,
  targets: Array<{ provider: any; model: string }>,
  messages: { role: string; content: string }[]
) {
  const attempts: any[] = []
  const healthyTargets = targets.filter(t => (manager as any).keysFor(t.provider).length > 0 || (manager as any).rawKeysFor(t.provider).length > 0)
  const queue = healthyTargets.length ? healthyTargets : targets
  for (let i = 0; i < queue.length; i += 2) {
    const batch = queue.slice(i, i + 2)
    const results = await Promise.allSettled(batch.map(t => manager.chat(t.provider, t.model, messages, { temperature: 0.7, maxTokens: 1800 })))
    for (let j = 0; j < results.length; j++) {
      const r = results[j] as any
      const t = batch[j]
      if (r.status === "fulfilled") return { text: r.value.text, provider: r.value.provider, model: r.value.model, attempts }
      else {
        const err: any = (r as any).reason
        attempts.push({ provider: t.provider, model: t.model, error: err?.message ?? String(err), status: err?.status })
      }
    }
  }
  return { text: null as any, provider: null as any, model: null as any, attempts } as any
}

export async function POST(req: Request) {
  await ensureDemoProfiles()
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })
  try {
    const body = await req.json().catch(()=> ({}))
    const prompt = (body.task ?? body.prompt ?? body.message ?? body.content ?? "").toString()
    const language = (body.language ?? "tsx").toString()
    if (!prompt || !prompt.trim()) return NextResponse.json({ error: "Prompt gerekli." }, { status: 400 })

    // Görevi zorla kod/arama ile sınırla — orchestrator kararı gorsel/dokuman vs ise kod'a kilitle
    let decision: any = routeRequest(prompt)
    let task = decision.task
    let isResearch = false
    if (!ALLOWED_TASKS.includes(task)) {
      // araştırma kelimeleri varsa arama, yoksa kod
      const low = prompt.toLowerCase()
      if (/(ara|arastir|araştır|guncel|güncel|haber|fiyat|nedir|kimdir|nerede|api|fetch|ara |web )/i.test(low)) {
        task = "arama"; isResearch = true
      } else {
        task = "kod"
      }
      decision.task = task
      decision.agent = task === "arama" ? "search" : "code"
    } else {
      isResearch = task === "arama"
    }

    // Sadece kod/arama havuzlarını kullan — providerManager içinde bu görevlere özel keyler
    const manager = createProviderManager()
    const wantedTask: any = task

    let assistantText = ""
    let usedProvider: any = null
    let usedModel: any = null
    let toolOutput: string | null = null

    // Arama ise web search yap ve bağlama ekle
    let searchContext = ""
    if (isResearch) {
      try {
        const results: any[] = await Promise.race([
          webSearch(prompt, 5) as any,
          new Promise<any[]>((_, rej)=> setTimeout(()=> rej(new Error("timeout")), 2500))
        ]).catch(()=>[] as any[])
        if (results && results.length) {
          const lines = (results as any[]).map((r,i)=> `${i+1}. ${r.title}\n${r.url}\n${r.snippet}`).join("\n\n")
          searchContext = `\n\n[Web arama sonuçları — bunları kullanarak güncel, doğru kod/araştırma üret]:\n${lines}`
          toolOutput = lines
        }
      } catch {}
    }

    const systemContent = isResearch
      ? `Sen Sucuk-Agent'sın — Türkçe, araştırma odaklı bir yapay zekâsın. Kullanıcı kod + güncel bilgiye ihtiyaç duyduğunda hem web arama sonuçlarını hem de en iyi kod pratiklerini birleştirerek yanıt ver. Görevin: araştırma + gerekirse kod üret. Kod üretirken dosya dili: ${language}. Yalnızca kod ve araştırma modelleri kullanıyorsun. Sadece istenen dilde, çalışır, temiz kod üret; gereksiz açıklama yok.`
      : `Sen Sucuk-Agent'sın — Türkçe, uzman bir kod asistanısın. Görevin: ${language} dilinde, modern, çalışır, production-ready kod üretmek. Sadece kod yazan modelleri kullanıyorsun (kod havuzu). Kullanıcı ne isterse doğrudan ${language} kodunu üret, gereksiz açıklama ekleme. Kod bloğu halinde döndür, dosya hazır olacak şekilde.`

    const messages = [
      { role: "system", content: systemContent + searchContext },
      { role: "user", content: `Dil: ${language}\nİstek: ${prompt}\n\nSadece ${language} kodunu üret, gereksiz gevezelik yok. Kod direkt çalışır olmalı.` },
    ]

    // Zincir: task'a özel fallback — sadece kod/arama provider'ları
    let order: Array<{ provider: any; model: string }>
    try {
      const taskChain = getFallbackChain(wantedTask, decision.provider)
      // Sadece izin verilen görev provider'larına filtrele (kod/arama)
      const allowedProviders = new Set([...TASK_DISTRIBUTION.kod.fallbacks, TASK_DISTRIBUTION.kod.primary, ...TASK_DISTRIBUTION.arama.fallbacks, TASK_DISTRIBUTION.arama.primary])
      const filtered = taskChain.filter(t => allowedProviders.has(t.provider))
      // karar modeli başta olsun
      if (filtered[0]?.provider !== decision.provider || filtered[0]?.model !== decision.model) {
        order = [{ provider: decision.provider, model: decision.model }, ...filtered.filter(o => o.provider !== decision.provider || o.model !== decision.model)]
      } else order = filtered
      if (order.length === 0) order = taskChain
    } catch {
      order = [{ provider: decision.provider, model: decision.model }]
    }

    const availableCount = (manager as any).availableProviders().length
    const maxTry = Math.max(4, Math.min(order.length, availableCount || order.length, 7))
    order = order.slice(0, maxTry)

    const result: any = await tryProviders(manager, order, messages)
    if (result && result.text) {
      assistantText = result.text
      usedProvider = result.provider
      usedModel = result.model
    } else {
      return NextResponse.json({ ok: false, error: "Kod üretilemedi — kota dolu, 15sn sonra tekrar dene", decision, attempts: result.attempts, toolOutput }, { status: 429 })
    }

    // Kod bloğunu temizle — ``` ``` içindeyse çıkar
    let code = assistantText
    const m = code.match(/```(?:\w+)?\n([\s\S]*?)```/)
    if (m) code = m[1].trim()
    // Eğer hiç kod bloğu yoksa tüm metni kod kabul et (research harmanlı olabilir)

    return NextResponse.json({ ok: true, code, text: assistantText, decision, usedProvider, usedModel, toolOutput, task: wantedTask })
  } catch (e: any) {
    return NextResponse.json({ error: "Kod üretme hatası: " + (e?.message ?? String(e)) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Kod agent — sadece kod/arama modelleri. POST ile prompt gönder.", allowed: ALLOWED_TASKS, pools: { kod: TASK_DISTRIBUTION.kod, arama: TASK_DISTRIBUTION.arama } })
}
