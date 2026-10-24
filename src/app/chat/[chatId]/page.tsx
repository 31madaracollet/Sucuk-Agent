"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Send,
  Bot,
  Sparkles,
  Search,
  Brain,
  Code2,
  Image as ImageIcon,
  RefreshCw,
  Info,
  AlertCircle,
  ShieldCheck,
  Zap,
  Wand2,
  Download,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { CodeBlock, parseMessageWithCode } from "@/components/ui/code-block"
import { planComplexTask } from "@/lib/orchestrator"

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const chatId = params.chatId as string

  const [messages, setMessages] = useState<any[]>([])
  const [chat, setChat] = useState<any>(null)
  const [input, setInput] = useState("")
  const mode = "auto" as const
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [usedProvider, setUsedProvider] = useState<string | null>(null)
  const [usedModel, setUsedModel] = useState<string | null>(null)
  const [limitExhausted, setLimitExhausted] = useState(false)
  const [lastDecision, setLastDecision] = useState<any>(null)
  const [typingId, setTypingId] = useState<string | null>(null)
  const [typedContent, setTypedContent] = useState<Record<string,string>>({})
  const endRef = useRef<HTMLDivElement>(null)

  async function load() {
    const res = await fetch(`/api/chat/${chatId}`, { credentials: "include" })
    if (!res.ok) {
      router.push("/dashboard")
      return
    }
    const data = await res.json()
    setChat(data.chat)
    setMessages(data.messages ?? [])
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 7000)
    return () => clearInterval(id)
  }, [chatId])

  // daktilo efekti
  useEffect(()=>{
    if(!typingId) return
    const full = messages.find(m=>m.id===typingId)?.content || ""
    if(!full) return
    let i = 0
    const chunk = 3
    const timer = setInterval(()=>{
      i += chunk
      setTypedContent(prev=>({...prev, [typingId!]: full.slice(0,i)}))
      if(i >= full.length){
        clearInterval(timer)
        setTypingId(null)
      }
    }, 18)
    return ()=>clearInterval(timer)
  },[typingId, messages])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || sending) return
    const userMsg = { id: "tmp-" + Date.now(), sender: "user" as const, content: input, createdAt: new Date().toISOString() }
    setMessages((m) => [...m, userMsg])
    setSending(true)
    // Orchestration check
    const plan = planComplexTask(input)
    if(plan){
      setStatus(`🧩 Çoklu görev algılandı: ${plan.task} — ${plan.steps.length} adım: ${plan.steps.map(s=>s.description).join(" → ")}`)
    } else {
      setStatus("Agent rota çiziyor… (görsel→FLUX, kod→GPT-OSS 120B, akıl→Reasoner)")
    }
    setLimitExhausted(false)
    const bodyMsg = input
    setInput("")

    try {
      const payload: any = { content: bodyMsg, mode: "auto" }
      const res = await fetch(`/api/chat/${chatId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) {
        setMessages((m) => [...m, { id: "err-" + Date.now(), sender: "assistant", content: `Hata: ${data.error || "Bilinmeyen hata."}`, createdAt: new Date().toISOString() } as any])
      } else {
        setUsedProvider(data.usedProvider ?? null)
        setUsedModel(data.usedModel ?? null)
        setLastDecision(data.decision ?? null)
        setLimitExhausted(Boolean(data.limitExhausted))
        setStatus(data.limitExhausted ? "Limit doldu — yedek beleşe geçildi" : null)
        if (data.toolOutput) {
          setMessages((m) => [
            ...m,
            {
              id: "tool-" + Date.now(),
              sender: "assistant",
              content: `🔎 Web Arama (Groq + DuckDuckGo):\n${data.toolOutput}`,
              provider: "web-search",
              createdAt: new Date().toISOString(),
            },
          ])
        }
        const newId = "asst-" + Date.now()
        const asst = { id: newId, sender: "assistant" as const, content: data.assistant, provider: data.usedProvider, model: data.usedModel, createdAt: new Date().toISOString() }
        setMessages((m) => [...m, asst as any])
        setTypedContent(prev=>({...prev, [newId]:""}))
        setTypingId(newId)
        fetch("/api/drive/auto", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ chatId }), credentials:"include" }).catch(()=>{})

      }
    } catch (err: any) {
      setMessages((m) => [...m, { id: "err2-" + Date.now(), sender: "assistant", content: `Bağlantı hatası: ${err?.message || String(err)}`, createdAt: new Date().toISOString() } as any])
    } finally {
      setSending(false)
      setTimeout(() => setStatus(null), 4000)
    }
  }

  const providerLabel = (p: string | null) => {
    const labels: Record<string, string> = {
      google: "Google",
      openai: "OpenAI",
      groq: "Groq",
      grok: "Grok",
      openrouter: "OpenRouter",
      deepseek: "DeepSeek",
      kimi: "KIMI",
      nvidia: "Nvidia",
      huggingface: "HuggingFace",
      "web-search": "Web Arama",
    }
    return p ? labels[p] || p : "—"
  }

  function renderMessageContent(content: string, msgId?: string) {
    const display = msgId && typedContent[msgId] !== undefined ? typedContent[msgId] : content
    const toRender = display
    // Kod blokları için CodeBlock kullan
    const parts = parseMessageWithCode(toRender)
    const hasCode = parts.some(p=>p.type==="code")
    if(hasCode){
      return (
        <div className="space-y-2">
          {parts.map((p,i)=> p.type==="code" ? <CodeBlock key={i} code={p.content} language={p.lang || "tsx"} prompt={content.slice(0,200)} /> : <span key={i} className="whitespace-pre-wrap break-words">{p.content}</span>)}
        </div>
      )
    }
    const imgMatch = toRender.match(/!\[.*?\]\(data:image\/[^)]+\)/)
    if (imgMatch) {
      const before = toRender.slice(0, imgMatch.index!)
      const after = toRender.slice(imgMatch.index! + imgMatch[0].length)
      return (
        <>
          {before && <p className="whitespace-pre-wrap break-words">{before.trim()}</p>}
          <img src={imgMatch[1]} alt="generated" className="mt-3 max-w-full rounded-xl border border-zinc-800" />
          {after && <p className="mt-3 whitespace-pre-wrap break-words text-zinc-300">{after.trim()}</p>}
        </>
      )
    }
    // http görselleri de render et
    const httpImg = toRender.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|webp)/i)
    if(httpImg){
      return (
        <>
          <span className="whitespace-pre-wrap break-words">{toRender}</span>
          <img src={httpImg[0]} alt="stock" className="mt-3 max-w-full rounded-xl border border-zinc-800" />
        </>
      )
    }
    return <span className="whitespace-pre-wrap break-words">{toRender}</span>
  }

  async function downloadPDF(content: string, title: string){
    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF()
    doc.setFontSize(12)
    doc.text(title, 10, 15)
    const lines = doc.splitTextToSize(content, 180)
    doc.setFontSize(10)
    doc.text(lines, 10, 25)
    doc.save(`${title.slice(0,30)}-${Date.now()}.pdf`)
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar/>
      <div className="flex flex-1">
        <Sidebar/>
        <div className="flex-1 flex flex-col min-h-[calc(100vh-56px)]">
      {/* ÜST BAR */}
      <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">
              <Bot className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">{chat?.title || "Sohbet"}</p>
              <p className="truncate text-xs text-zinc-500">
                {lastDecision ? (
                  <>
                    <span className="text-zinc-300">{lastDecision.agent}</span> • {providerLabel(usedProvider)} • {usedModel} • <span className="text-zinc-400">{lastDecision.reason.slice(0, 80)}</span>
                  </>
                ) : usedProvider ? `${providerLabel(usedProvider)} • ${usedModel}` : "Hazır — Agent beleş modellere öncelik verir"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-black"><Sparkles className="h-3 w-3" /> AGENT</span>
            <span className={`hidden lg:inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${limitExhausted ? "border-red-900 bg-red-950 text-red-300" : "border-zinc-800 bg-zinc-900 text-zinc-400"}`}>
              {limitExhausted ? <AlertCircle className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />} {limitExhausted ? "Yedek" : "Otomatik"}
            </span>
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 pb-2">
          <p className="text-[11px] leading-relaxed text-zinc-500">
            Agent: göreve göre beleşe öncelik verir — kod→GPT-OSS 120B, köpek çiz→FLUX.1 Schnell, akıl→Reasoner, genel→GPT-OSS 20B/Gemini 3.8. Supabase + Drive oto yedek aktif. Kod kutusu kopyala, PDF indir, tema otomatik.
          </p>
        </div>
      </div>

      {/* MESAJLAR */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
          {messages.length === 0 && (
            <div className="animate-in flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black mb-4 shadow-lg">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">Nasıl yardımcı olayım?</h3>
              <p className="mt-1 max-w-md text-sm text-zinc-400">Beleş modellere öncelik veren siyah-beyaz cihaz. Kod, görsel, web arama, editör ve derin düşünme tek yerde.</p>
              <div className="mt-6 grid w-full max-w-md grid-cols-2 gap-2">
                <button onClick={() => setInput("Python ile todo uygulaması yaz")} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-left hover:border-white hover:bg-zinc-800 transition">
                  <Code2 className="mb-1 h-4 w-4 text-white" /><p className="text-xs font-medium">Kod yaz</p><p className="text-[11px] text-zinc-500">GPT-OSS 120B • beleş</p>
                </button>
                <button onClick={() => setInput("Güncel yapay zeka haberlerini ara")} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-left hover:border-white hover:bg-zinc-800 transition">
                  <Search className="mb-1 h-4 w-4 text-white" /><p className="text-xs font-medium">Web'de ara</p><p className="text-[11px] text-zinc-500">Groq + web</p>
                </button>
                <button onClick={() => setInput("Satış ve alışveriş sitesi hazırla: ürün fotoğrafları ve kodları ile tam paket")} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-left hover:border-white hover:bg-zinc-800 transition">
                  <ImageIcon className="mb-1 h-4 w-4 text-white" /><p className="text-xs font-medium">Satış Sitesi</p><p className="text-[11px] text-zinc-500">FLUX + DeepSeek + GitHub</p>
                </button>
                <button onClick={() => setInput("Uzay temalı bir köpek çiz, poster gibi olsun")} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-left hover:border-white hover:bg-zinc-800 transition">
                  <ImageIcon className="mb-1 h-4 w-4 text-white" /><p className="text-xs font-medium">Köpek çiz</p><p className="text-[11px] text-zinc-500">FLUX.1 • beleş</p>
                </button>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-2 text-[11px]">
                <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-zinc-400 flex items-center gap-1"><Zap className="h-3 w-3" /> Genel: GPT-OSS 20B • Gemini 3.8</span>
                <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-zinc-400 flex items-center gap-1"><Wand2 className="h-3 w-3" /> Görsel: FLUX.1 • Prompt Guard + stok fallback</span>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              {msg.sender === "user" ? (
                <div className="max-w-[85%]">
                  <div className="rounded-2xl rounded-br-md bg-white px-4 py-3 text-sm leading-relaxed text-black shadow">{renderMessageContent(msg.content, msg.id)}</div>
                  <p className="mt-1 text-right text-[10px] text-zinc-500">Sen • {new Date(msg.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              ) : (
                <div className="flex max-w-[85%] gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
                    <Bot className="h-3.5 w-3.5 text-zinc-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="rounded-2xl rounded-tl-md border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm leading-relaxed text-zinc-100 shadow-sm">
                      {renderMessageContent(msg.content, msg.id)}
                      {typingId===msg.id && <span className="inline-block w-1.5 h-4 bg-zinc-500 ml-0.5 animate-pulse align-middle">▌</span>}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500">
                      <span>{msg.provider ? providerLabel(msg.provider) : "Asistan"} {msg.model ? `• ${msg.model}` : ""} • {new Date(msg.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
                      <button onClick={()=>downloadPDF(msg.content, `sucuk-${msg.id}`)} className="flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-1 text-xs hover:bg-white hover:text-black"><Download className="h-3 w-3"/> PDF</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>

      {status && (
        <div className="mx-auto w-full max-w-3xl px-4">
          <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300">
            <Info className="h-4 w-4 text-zinc-400" /> {status}
          </div>
        </div>
      )}
      {limitExhausted && (
        <div className="mx-auto w-full max-w-3xl px-4 pb-1">
          <div className="flex items-center gap-2 rounded-xl border border-red-900 bg-red-950 px-3 py-2 text-xs text-red-200">
            <AlertCircle className="h-4 w-4" /> Kota doldu — yedek beleş modele geçildi. Stok görsel fallback aktif.
          </div>
        </div>
      )}

      {/* YAZMA ÇUBUĞU */}
      <div className="sticky bottom-0 border-t border-zinc-800 bg-zinc-950">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-2 shadow-lg focus-within:border-white focus-within:ring-1 focus-within:ring-white">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e as any)
                }
              }}
              placeholder="Agent'a yaz… (satış sitesi → çoklu görev, köpek çiz → FLUX, kod → GPT-OSS 120B)"
              rows={1}
              disabled={sending}
              className="max-h-32 min-h-[44px] flex-1 resize-none border-0 bg-transparent text-sm placeholder:text-zinc-500 focus:ring-0 focus-visible:ring-0 shadow-none"
            />
            <Button type="submit" disabled={sending || !input.trim()} className="h-10 w-10 shrink-0 rounded-xl bg-white p-0 text-black hover:bg-zinc-200">
              {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          <p className="mt-2 text-center text-[11px] text-zinc-500">Enter gönderir • Shift+Enter yeni satır • Supabase + Drive oto yedek ✓ • Auto-scroll kapalı • Kod kutusu & PDF aktif</p>
        </div>
      </div>
        </div>
      </div>
    </div>
  )
}
