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
  ChevronDown,
  Settings2,
  ShieldCheck,
  Zap,
  Cpu,
  Wand2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type CatalogEntry = { provider: string; model: string; label: string; group: string; task: string; free: boolean }

const MODEL_OPTIONS: CatalogEntry[] = [
  // Genel — beleş öncelikli
  { provider: "groq", model: "openai/gpt-oss-20b", label: "GPT-OSS 20B ⚡", group: "Genel • Beleş", task: "genel", free: true },
  { provider: "google", model: "gemini-3.8-flash", label: "Gemini 3.8 Flash", group: "Genel • Beleş", task: "genel", free: true },
  { provider: "huggingface", model: "Qwen/Qwen2.5-7B-Instruct", label: "Qwen 2.5 7B", group: "Genel • Beleş", task: "genel", free: true },
  { provider: "openai", model: "gpt-4o-mini", label: "GPT-4o mini", group: "Genel", task: "genel", free: false },
  // Kod
  { provider: "groq", model: "openai/gpt-oss-120b", label: "GPT-OSS 120B 🧠", group: "Kod • Beleş", task: "kod", free: true },
  { provider: "openrouter", model: "anthropic/claude-sonnet-5.5", label: "Claude Sonnet 5.5", group: "Kod", task: "kod", free: false },
  { provider: "huggingface", model: "Qwen/Qwen2.5-Coder-7B-Instruct", label: "Qwen Coder 7B", group: "Kod • Beleş", task: "kod", free: true },
  { provider: "kimi", model: "moonshot-v1-32k", label: "Moonshot 32K", group: "Kod", task: "kod", free: false },
  // Akıl
  { provider: "deepseek", model: "deepseek-reasoner", label: "DeepSeek Reasoner", group: "Akıl", task: "akıl", free: false },
  { provider: "nvidia", model: "nvidia/llama-3.3-nemotron-super-49b-v1", label: "Nemotron Super 49B", group: "Akıl", task: "akıl", free: false },
  { provider: "openai", model: "gpt-4o", label: "GPT-4o", group: "Akıl", task: "akıl", free: false },
  // Görsel — Hugging Face
  { provider: "huggingface", model: "black-forest-labs/FLUX.1-schnell", label: "FLUX.1 Schnell", group: "Görsel • Beleş", task: "gorsel", free: true },
  { provider: "huggingface", model: "stabilityai/stable-diffusion-xl-base-1.0", label: "SDXL 1.0", group: "Görsel • Beleş", task: "gorsel", free: true },
  // Arama / diğer
  { provider: "deepseek", model: "deepseek-chat", label: "DeepSeek Chat", group: "Genel", task: "genel", free: false },
  { provider: "kimi", model: "moonshot-v1-8k", label: "Moonshot 8K", group: "Genel", task: "genel", free: false },
  { provider: "google", model: "gemini-3.8-flash-lite", label: "Gemini 3.8 Lite", group: "Genel • Beleş", task: "genel", free: true },
  { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B Free", group: "Genel • Beleş", task: "genel", free: true },
  { provider: "nvidia", model: "nvidia/llama-3.1-nemotron-70b-instruct", label: "Nemotron 70B", group: "Genel", task: "genel", free: false },
]

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const chatId = params.chatId as string

  const [messages, setMessages] = useState<any[]>([])
  const [chat, setChat] = useState<any>(null)
  const [input, setInput] = useState("")
  const [mode, setMode] = useState<"auto" | "plain">("auto")
  const [selectedProvider, setSelectedProvider] = useState("groq")
  const [selectedModel, setSelectedModel] = useState("openai/gpt-oss-20b")
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [usedProvider, setUsedProvider] = useState<string | null>(null)
  const [usedModel, setUsedModel] = useState<string | null>(null)
  const [limitExhausted, setLimitExhausted] = useState(false)
  const [lastDecision, setLastDecision] = useState<any>(null)
  const endRef = useRef<HTMLDivElement>(null)

  // İlk yük + localStorage'dan seçimi geri al
  useEffect(() => {
    try {
      const s = localStorage.getItem("sucuk:plain:model")
      if (s) {
        const [p, ...rest] = s.split("|")
        const m = rest.join("|")
        if (p && m) {
          setSelectedProvider(p)
          setSelectedModel(m)
        }
      }
      const mo = localStorage.getItem("sucuk:mode") as any
      if (mo === "auto" || mo === "plain") setMode(mo)
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("sucuk:plain:model", `${selectedProvider}|${selectedModel}`)
    } catch {}
  }, [selectedProvider, selectedModel])

  useEffect(() => {
    try {
      localStorage.setItem("sucuk:mode", mode)
    } catch {}
  }, [mode])

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

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function handleModelChange(value: string) {
    const [prov, ...rest] = value.split("|")
    const mdl = rest.join("|")
    setSelectedProvider(prov)
    setSelectedModel(mdl)
    // Kullanıcı Düz modda model değiştirirse anında geri bildirim
    setStatus(`Düz mod: ${prov} / ${mdl} seçildi — sıradaki mesaj bu modelle gider`)
    setTimeout(() => setStatus(null), 2200)
  }

  function switchMode(next: "auto" | "plain") {
    setMode(next)
    if (next === "auto") setStatus("Agent devrede — AI göreve göre en iyi beleş modeli seçer (köpek çiz → FLUX, kod → GPT-OSS 120B…)")
    else setStatus(`Düz mod: ${selectedProvider}/${selectedModel} sabitlendi, kota biterse otomatik yedeğe geçer`)
    setTimeout(() => setStatus(null), 2500)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || sending) return
    const userMsg = { id: "tmp-" + Date.now(), sender: "user" as const, content: input, createdAt: new Date().toISOString() }
    setMessages((m) => [...m, userMsg])
    setSending(true)
    setStatus(mode === "auto" ? "Agent rota çiziyor… (görsel→FLUX, kod→GPT-OSS 120B, akıl→Reasoner)" : "Gönderiliyor…")
    setLimitExhausted(false)
    const bodyMsg = input
    setInput("")

    try {
      const payload: any = { content: bodyMsg, mode }
      if (mode === "plain") {
        payload.provider = selectedProvider
        payload.model = selectedModel
      }
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
        setStatus(data.limitExhausted ? "Limit doldu — yedek beleşe geçildi veya Düz mod önerildi" : null)
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
        // Görsel base64 markdown desteği: ![generated](data:...)
        setMessages((m) => [...m, { id: "asst-" + Date.now(), sender: "assistant", content: data.assistant, provider: data.usedProvider, model: data.usedModel, createdAt: new Date().toISOString() } as any])
      }
    } catch (err: any) {
      setMessages((m) => [...m, { id: "err2-" + Date.now(), sender: "assistant", content: `Bağlantı hatası: ${err?.message || String(err)}`, createdAt: new Date().toISOString() } as any])
    } finally {
      setSending(false)
      setTimeout(() => setStatus(null), 3000)
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

  const selectedLabel = MODEL_OPTIONS.find((o) => o.provider === selectedProvider && o.model === selectedModel)?.label || selectedModel
  const selectedGroup = MODEL_OPTIONS.find((o) => o.provider === selectedProvider && o.model === selectedModel)?.group || ""

  function renderMessageContent(content: string) {
    // Basit markdown image desteği
    const imgMatch = content.match(/!\[.*?\]\((data:image\/[^)]+)\)/)
    if (imgMatch) {
      const before = content.slice(0, imgMatch.index!)
      const after = content.slice(imgMatch.index! + imgMatch[0].length)
      return (
        <>
          {before && <p className="whitespace-pre-wrap break-words">{before.trim()}</p>}
          <img src={imgMatch[1]} alt="generated" className="mt-3 max-w-full rounded-xl border border-zinc-800" />
          {after && <p className="mt-3 whitespace-pre-wrap break-words text-zinc-300">{after.trim()}</p>}
        </>
      )
    }
    return <span className="whitespace-pre-wrap break-words">{content}</span>
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col bg-zinc-950 text-zinc-100">
      {/* ÜST BAR — cihaz, siyah beyaz premium */}
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
            {/* Agent / Düz */}
            <div className="flex rounded-full border border-zinc-800 bg-zinc-900 p-1">
              <button
                onClick={() => switchMode("auto")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${mode === "auto" ? "bg-white text-black shadow" : "text-zinc-400 hover:text-white"}`}
              >
                <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> Agent</span>
              </button>
              <button
                onClick={() => switchMode("plain")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${mode === "plain" ? "bg-white text-black shadow" : "text-zinc-400 hover:text-white"}`}
              >
                <span className="inline-flex items-center gap-1"><Settings2 className="h-3 w-3" /> Düz</span>
              </button>
            </div>

            {/* Model seçici — her iki modda da göster, ama Agent'ta salt okunur + Düz'e geçiş */}
            <div className="relative hidden sm:block">
              {mode === "plain" ? (
                <div className="relative">
                  <select
                    value={`${selectedProvider}|${selectedModel}`}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="appearance-none rounded-full border border-zinc-800 bg-zinc-900 py-2 pl-3 pr-8 text-xs font-medium text-zinc-100 focus:outline-none focus:ring-2 focus:ring-white"
                  >
                    {Object.entries(
                      MODEL_OPTIONS.reduce((acc: any, o) => {
                        (acc[o.group] = acc[o.group] || []).push(o)
                        return acc
                      }, {})
                    ).map(([group, opts]: any) => (
                      <optgroup key={group} label={group}>
                        {opts.map((o: any) => (
                          <option key={o.provider + "|" + o.model} value={o.provider + "|" + o.model}>
                            {o.free ? "● " : ""}{o.label} {o.free ? "(beleş)" : ""}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-500" />
                </div>
              ) : (
                <button
                  onClick={() => switchMode("plain")}
                  className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-400 hover:text-white"
                  title="Modeli sabitlemek için Düz moda geç"
                >
                  <Cpu className="h-3 w-3" /> Agent seçiyor <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-black">DÜZ'E GEÇ</span>
                </button>
              )}
            </div>

            <span className={`hidden lg:inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${limitExhausted ? "border-red-900 bg-red-950 text-red-300" : "border-zinc-800 bg-zinc-900 text-zinc-400"}`}>
              {limitExhausted ? <AlertCircle className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />} {limitExhausted ? "Yedek" : mode === "auto" ? "Otomatik" : selectedLabel}
            </span>
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 pb-2">
          <p className="text-[11px] leading-relaxed text-zinc-500">
            {mode === "auto"
              ? "Agent: göreve göre beleşe öncelik verir — kod→GPT-OSS 120B (Groq), köpek çiz→FLUX.1 Schnell (HF), akıl→Reasoner, genel→GPT-OSS 20B/Gemini 3.8. Kota biterse otomatik sıradaki beleşe geçer. Sabit model istiyorsan Düz'e geç."
              : `Düz: doğrudan ${providerLabel(selectedProvider)} — ${selectedLabel} (${selectedGroup}) ile konuşuyorsun. Kota biterse sıradaki beleş modele geçer. Agent'a dönmek için üstten Agent'e bas.`}
          </p>
        </div>
      </div>

      {/* MESAJLAR — ortalanmış premium */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
          {messages.length === 0 && (
            <div className="animate-in flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black mb-4 shadow-lg">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">Nasıl yardımcı olayım?</h3>
              <p className="mt-1 max-w-md text-sm text-zinc-400">Beleş modellere öncelik veren siyah-beyaz cihaz. Kod, görsel, web arama ve derin düşünme tek yerde.</p>
              <div className="mt-6 grid w-full max-w-md grid-cols-2 gap-2">
                <button onClick={() => setInput("Python ile todo uygulaması yaz")} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-left hover:border-white hover:bg-zinc-800 transition">
                  <Code2 className="mb-1 h-4 w-4 text-white" /><p className="text-xs font-medium">Kod yaz</p><p className="text-[11px] text-zinc-500">GPT-OSS 120B • beleş</p>
                </button>
                <button onClick={() => setInput("Güncel yapay zeka haberlerini ara")} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-left hover:border-white hover:bg-zinc-800 transition">
                  <Search className="mb-1 h-4 w-4 text-white" /><p className="text-xs font-medium">Web'de ara</p><p className="text-[11px] text-zinc-500">Groq + web</p>
                </button>
                <button onClick={() => setInput("Uzay temalı bir köpek çiz, poster gibi olsun")} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-left hover:border-white hover:bg-zinc-800 transition">
                  <ImageIcon className="mb-1 h-4 w-4 text-white" /><p className="text-xs font-medium">Köpek çiz</p><p className="text-[11px] text-zinc-500">FLUX.1 • beleş</p>
                </button>
                <button onClick={() => setInput("Bu problemi adım adım çöz: ")} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-left hover:border-white hover:bg-zinc-800 transition">
                  <Brain className="mb-1 h-4 w-4 text-white" /><p className="text-xs font-medium">Derin düşün</p><p className="text-[11px] text-zinc-500">Reasoner • Nemotron</p>
                </button>
              </div>
              {/* Görev şeridi */}
              <div className="mt-6 flex flex-wrap justify-center gap-2 text-[11px]">
                <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-zinc-400 flex items-center gap-1"><Zap className="h-3 w-3" /> Genel: GPT-OSS 20B • Gemini 3.8</span>
                <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-zinc-400 flex items-center gap-1"><Wand2 className="h-3 w-3" /> Görsel: FLUX.1 • SDXL (beleş)</span>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              {msg.sender === "user" ? (
                <div className="max-w-[85%]">
                  <div className="rounded-2xl rounded-br-md bg-white px-4 py-3 text-sm leading-relaxed text-black shadow">{renderMessageContent(msg.content)}</div>
                  <p className="mt-1 text-right text-[10px] text-zinc-500">Sen • {new Date(msg.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              ) : (
                <div className="flex max-w-[85%] gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
                    <Bot className="h-3.5 w-3.5 text-zinc-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="rounded-2xl rounded-tl-md border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm leading-relaxed text-zinc-100 shadow-sm">
                      {renderMessageContent(msg.content)}
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      {msg.provider ? providerLabel(msg.provider) : "Asistan"} {msg.model ? `• ${msg.model}` : ""} • {new Date(msg.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
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
            <AlertCircle className="h-4 w-4" /> Kota doldu — yedek beleş modele geçildi. Ayarlar → sağlayıcı durumuna bak.
          </div>
        </div>
      )}

      {/* YAZMA ÇUBUĞU — premium cihaz */}
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
              placeholder={mode === "auto" ? "Agent'a yaz… (köpek çiz → FLUX, kod → GPT-OSS 120B otomatik)" : `Düz: ${selectedLabel} ile…`}
              rows={1}
              disabled={sending}
              className="max-h-32 min-h-[44px] flex-1 resize-none border-0 bg-transparent text-sm placeholder:text-zinc-500 focus:ring-0 focus-visible:ring-0 shadow-none"
            />
            <Button type="submit" disabled={sending || !input.trim()} className="h-10 w-10 shrink-0 rounded-xl bg-white p-0 text-black hover:bg-zinc-200">
              {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          <p className="mt-2 text-center text-[11px] text-zinc-500">Enter gönderir • Shift+Enter yeni satır • Üstten Agent/Düz ve model değiştir • Sohbet Supabase'e yazılır, Drive'a yedeklenebilir</p>
        </div>
      </div>
    </div>
  )
}
