"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Send,
  MessageCircle,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const MODEL_OPTIONS: Array<{ provider: string; model: string; label: string; group: string }> = [
  { provider: "google", model: "gemini-2.0-flash", label: "Gemini 2.0 Flash", group: "Google" },
  { provider: "google", model: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite", group: "Google" },
  { provider: "openai", model: "gpt-4o-mini", label: "GPT-4o mini", group: "OpenAI" },
  { provider: "openai", model: "gpt-4o", label: "GPT-4o", group: "OpenAI" },
  { provider: "groq", model: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", group: "Groq" },
  { provider: "groq", model: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant", group: "Groq" },
  { provider: "openrouter", model: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet", group: "OpenRouter" },
  { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B (OR)", group: "OpenRouter" },
  { provider: "deepseek", model: "deepseek-chat", label: "DeepSeek Chat", group: "DeepSeek" },
  { provider: "deepseek", model: "deepseek-reasoner", label: "DeepSeek Reasoner", group: "DeepSeek" },
  { provider: "kimi", model: "moonshot-v1-8k", label: "Moonshot 8K", group: "KIMI" },
  { provider: "kimi", model: "moonshot-v1-32k", label: "Moonshot 32K", group: "KIMI" },
  { provider: "nvidia", model: "meta/llama-3.3-70b-instruct", label: "Llama 3.3 70B (Nvidia)", group: "Nvidia" },
  { provider: "nvidia", model: "nvidia/llama-3.1-nemotron-70b-instruct", label: "Nemotron 70B", group: "Nvidia" },
  { provider: "huggingface", model: "HuggingFaceH4/zephyr-7b-beta", label: "Zephyr 7B", group: "Hugging Face" },
];

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const chatId = params.chatId as string;

  const [messages, setMessages] = useState<any[]>([]);
  const [chat, setChat] = useState<any>(null);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"auto" | "plain">("auto");
  const [selectedProvider, setSelectedProvider] = useState("groq");
  const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [usedProvider, setUsedProvider] = useState<string | null>(null);
  const [usedModel, setUsedModel] = useState<string | null>(null);
  const [limitExhausted, setLimitExhausted] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch(`/api/chat/${chatId}`, { credentials: "include" });
    if (!res.ok) {
      router.push("/dashboard");
      return;
    }
    const data = await res.json();
    setChat(data.chat);
    setMessages(data.messages ?? []);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 6000);
    return () => clearInterval(id);
  }, [chatId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleModelChange(value: string) {
    const [prov, ...rest] = value.split("|");
    const mdl = rest.join("|");
    setSelectedProvider(prov);
    setSelectedModel(mdl);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg = { id: "tmp-" + Date.now(), sender: "user" as const, content: input, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setSending(true);
    setStatus("Yanıt hazırlanıyor...");
    setLimitExhausted(false);

    const bodyMsg = input;
    setInput("");

    try {
      const payload: any = { content: bodyMsg, mode };
      if (mode === "plain") {
        payload.provider = selectedProvider;
        payload.model = selectedModel;
      }
      const res = await fetch(`/api/chat/${chatId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((m) => [...m, { id: "err-" + Date.now(), sender: "assistant", content: `Hata: ${data.error || "Bilinmeyen hata."}`, createdAt: new Date().toISOString() } as any]);
      } else {
        setUsedProvider(data.usedProvider ?? null);
        setUsedModel(data.usedModel ?? null);
        setLimitExhausted(Boolean(data.limitExhausted));
        setStatus(data.limitExhausted ? "Limit doldu — Düz Sohbet Moduna geçildi" : null);
        if (data.toolOutput) {
          setMessages((m) => [
            ...m,
            {
              id: "tool-" + Date.now(),
              sender: "assistant",
              content: `🔍 Web Arama Sonuçları:\n${data.toolOutput}`,
              provider: "web-search",
              createdAt: new Date().toISOString(),
            },
          ]);
        }
        setMessages((m) => [...m, { id: "asst-" + Date.now(), sender: "assistant", content: data.assistant, provider: data.usedProvider, model: data.usedModel, createdAt: new Date().toISOString() } as any]);
      }
    } catch (err: any) {
      setMessages((m) => [...m, { id: "err2-" + Date.now(), sender: "assistant", content: `Bağlantı hatası: ${err?.message || String(err)}`, createdAt: new Date().toISOString() } as any]);
    } finally {
      setSending(false);
    }
  }

  const providerLabel = (p: string | null) => {
    const labels: Record<string, string> = {
      google: "Google Gemini",
      openai: "OpenAI",
      groq: "Groq",
      grok: "Grok (xAI)",
      openrouter: "OpenRouter",
      deepseek: "DeepSeek",
      kimi: "KIMI",
      nvidia: "Nvidia",
      huggingface: "Hugging Face",
      "web-search": "Web Arama",
    };
    return p ? labels[p] || p : "—";
  };

  const selectedLabel = MODEL_OPTIONS.find((o) => o.provider === selectedProvider && o.model === selectedModel)?.label || selectedModel;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gradient-to-b from-slate-50 via-white to-white">
      {/* ÜST BAR: Model seçici - benimki gibi ortada */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{chat?.title || "Sohbet"}</p>
              <p className="text-xs text-slate-500 truncate">{usedProvider ? `${providerLabel(usedProvider)} • ${usedModel}` : "Hazır"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Agent / Düz seçici */}
            <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1">
              <button
                onClick={() => setMode("auto")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${mode === "auto" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:text-slate-900"}`}
              >
                <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> Agent</span>
              </button>
              <button
                onClick={() => setMode("plain")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${mode === "plain" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:text-slate-900"}`}
              >
                <span className="inline-flex items-center gap-1"><Settings2 className="h-3 w-3" /> Düz</span>
              </button>
            </div>

            {/* Düz modda model seçici */}
            {mode === "plain" && (
              <div className="relative">
                <select
                  value={`${selectedProvider}|${selectedModel}`}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {Object.entries(
                    MODEL_OPTIONS.reduce((acc: any, o) => {
                      (acc[o.group] = acc[o.group] || []).push(o);
                      return acc;
                    }, {})
                  ).map(([group, opts]: any) => (
                    <optgroup key={group} label={group}>
                      {opts.map((o: any) => (
                        <option key={o.provider + "|" + o.model} value={o.provider + "|" + o.model}>
                          {o.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
              </div>
            )}

            {mode === "auto" && (
              <Badge variant={limitExhausted ? "danger" : "default"} className="rounded-full">
                {limitExhausted ? "Düz Mod" : "Otomatik"}
              </Badge>
            )}
            {mode === "plain" && <span className="text-xs text-slate-500 hidden sm:block">{selectedLabel}</span>}
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-4 pb-2">
          <p className="text-[11px] text-slate-400">
            {mode === "auto" ? "Agent otomatik olarak göreve göre en iyi modeli seçer (kod → OpenRouter, akıl → DeepSeek, görsel → HuggingFace...)" : `Düz mod: doğrudan ${providerLabel(selectedProvider)} — ${selectedLabel} ile konuşuyorsun. Anahtar biterse sıradakine geçer.`}
          </p>
        </div>
      </div>

      {/* MESAJLAR - ortalanmış, geniş */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white mb-4">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Nasıl yardımcı olayım?</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md">Kod yaz, görsel çizdir, web'de arat veya derin düşünmeyi dene. Üstten modu seç, alttan yaz.</p>
              <div className="grid grid-cols-2 gap-2 mt-6 w-full max-w-md">
                <button onClick={() => setInput("Python ile todo uygulaması yaz")} className="p-3 rounded-xl border bg-white text-left hover:border-slate-900 transition">
                  <Code2 className="h-4 w-4 mb-1" /><p className="text-xs font-medium">Kod yaz</p><p className="text-[11px] text-slate-500">Python todo</p>
                </button>
                <button onClick={() => setInput("Güncel yapay zeka haberlerini ara")} className="p-3 rounded-xl border bg-white text-left hover:border-slate-900 transition">
                  <Search className="h-4 w-4 mb-1" /><p className="text-xs font-medium">Web'de ara</p><p className="text-[11px] text-slate-500">Güncel haber</p>
                </button>
                <button onClick={() => setInput("Uzay temalı bir poster çiz")} className="p-3 rounded-xl border bg-white text-left hover:border-slate-900 transition">
                  <ImageIcon className="h-4 w-4 mb-1" /><p className="text-xs font-medium">Görsel üret</p><p className="text-[11px] text-slate-500">Poster</p>
                </button>
                <button onClick={() => setInput("Bu problemi adım adım çöz: ")} className="p-3 rounded-xl border bg-white text-left hover:border-slate-900 transition">
                  <Brain className="h-4 w-4 mb-1" /><p className="text-xs font-medium">Derin düşün</p><p className="text-[11px] text-slate-500">Reasoning</p>
                </button>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              {msg.sender === "user" ? (
                <div className="max-w-[85%]">
                  <div className="rounded-2xl rounded-br-md bg-slate-900 text-white px-4 py-3 text-sm leading-relaxed shadow">
                    {msg.content}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 text-right">Sen • {new Date(msg.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              ) : (
                <div className="flex gap-3 max-w-[85%]">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 border shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-slate-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="rounded-2xl rounded-tl-md bg-white border border-slate-200 px-4 py-3 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap break-words shadow-sm">
                      {msg.content}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
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
        <div className="mx-auto max-w-3xl w-full px-4">
          <div className="flex items-center gap-2 rounded-xl border bg-amber-50 border-amber-200 px-3 py-2 text-xs text-amber-800">
            <Info className="h-4 w-4" /> {status}
          </div>
        </div>
      )}
      {limitExhausted && (
        <div className="mx-auto max-w-3xl w-full px-4 pb-1">
          <div className="flex items-center gap-2 rounded-xl border bg-red-50 border-red-200 px-3 py-2 text-xs text-red-700">
            <AlertCircle className="h-4 w-4" /> Tüm anahtarlar tükendi — Düz Sohbet Modu aktif. Farklı model seçmeyi dene.
          </div>
        </div>
      )}

      {/* YAZMA ÇUBUĞU - ortada, büyük, benimki gibi */}
      <div className="sticky bottom-0 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              placeholder={mode === "auto" ? "Agent'a yaz... (otomatik yönlendirir)" : `Düz: ${selectedLabel} ile konuş...`}
              rows={1}
              disabled={sending}
              className="flex-1 min-h-[44px] max-h-32 border-0 focus:ring-0 focus-visible:ring-0 shadow-none resize-none bg-transparent text-sm placeholder:text-slate-400"
            />
            <Button type="submit" disabled={sending || !input.trim()} className="h-10 w-10 rounded-xl p-0 shrink-0">
              {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          <p className="text-center text-[11px] text-slate-400 mt-2">Enter gönderir • Shift+Enter yeni satır • Üstten modeli değiştir</p>
        </div>
      </div>
    </div>
  );
}
