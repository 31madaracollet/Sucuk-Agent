"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Send,
  MessageCircle,
  Bot,
  Image as ImageIcon,
  Search,
  Brain,
  Code2,
  RefreshCw,
  Eye,
  Globe,
  Info,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const chatId = params.chatId as string;

  const [messages, setMessages] = useState<any[]>([]);
  const [chat, setChat] = useState<any>(null);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"auto" | "plain">("auto");
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [imageEnabled, setImageEnabled] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [usedProvider, setUsedProvider] = useState<string | null>(null);
  const [usedModel, setUsedModel] = useState<string | null>(null);
  const [limitExhausted, setLimitExhausted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch(`/api/chat/${chatId}`, { credentials: "include" });
    if (!res.ok) {
      router.push("/dashboard");
      return;
    }
    const data = await res.json();
    setChat(data.chat);
    setMessages(data.messages ?? []);
    scrollToBottom();
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [chatId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg = { id: "tmp", sender: "user" as const, content: input, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setSending(true);
    setStatus("Yanıt hazırlanıyor...");
    setLimitExhausted(false);

    const bodyMsg = input;
    setInput("");
    scrollToBottom();

    try {
      const res = await fetch(`/api/chat/${chatId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: bodyMsg, mode }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((m) => [...m, { sender: "assistant", content: `Hata: ${data.error || "Bilinmeyen hata."}` }]);
      } else {
        setUsedProvider(data.usedProvider ?? null);
        setUsedModel(data.usedModel ?? null);
        setLimitExhausted(Boolean(data.limitExhausted));
        setStatus(data.limitExhausted ? "Limit doldu - Düz Sohbet Modu" : "Hazır");
        if (data.toolOutput) {
          setMessages((m) => [
            ...m,
            {
              sender: "assistant",
              content: `🔍 Web Arama Sonuçları:\n${data.toolOutput}`,
              provider: "web-search",
            },
          ]);
        }
        setMessages((m) => [...m, { sender: "assistant", ...data, content: data.assistant }]);
      }
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        { sender: "assistant", content: `Bağlantı hatası: ${err?.message || String(err)}` },
      ]);
    } finally {
      setSending(false);
      scrollToBottom();
    }
  }

  const providerLabel = (p: string | null) => {
    if (!p) return "—";
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
    return labels[p] || p;
  };

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-80 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Sohbet</h2>
          <Button size="sm" onClick={() => router.push("/dashboard")}>
            <MessageCircle className="ml-2 h-4 w-4" /> Liste
          </Button>
        </div>
        <div className="p-4 space-y-3 border-b border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mod</p>
          <div className="grid gap-2">
            <Button
              size="sm"
              variant={mode === "auto" ? "default" : "outline"}
              onClick={() => setMode("auto")}
              className="text-left"
            >
              <Bot className="mr-2 h-3 w-3" /> Otomatik Yönlendirme
            </Button>
            <Button
              size="sm"
              variant={mode === "plain" ? "default" : "outline"}
              onClick={() => setMode("plain")}
              className="text-left"
            >
              <MessageCircle className="mr-2 h-3 w-3" /> Düz Sohbet
            </Button>
          </div>
        </div>
        <div className="p-4 space-y-3 border-b border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Araçlar</p>
          <div className="grid gap-2">
            <Button
              size="sm"
              variant={searchEnabled ? "default" : "outline"}
              onClick={() => setSearchEnabled(!searchEnabled)}
              className="text-left"
            >
              <Search className="mr-2 h-3 w-3" /> Web Arama
            </Button>
            <Button
              size="sm"
              variant={imageEnabled ? "default" : "outline"}
              onClick={() => setImageEnabled(!imageEnabled)}
              className="text-left"
            >
              <ImageIcon className="mr-2 h-3 w-3" /> Görsel Üret
            </Button>
          </div>
        </div>
        <div className="p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Durum</p>
          <div className="flex items-center gap-2 p-2 rounded-md bg-slate-50">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-xs text-slate-600">Sistem aktif</span>
          </div>
          {usedProvider && (
            <div className="flex items-center gap-2 p-2 rounded-md border border-sucuk-100 bg-sucuk-50">
              <Badge variant="secondary" className="text-[10px]">
                {providerLabel(usedProvider)}
              </Badge>
              <span className="text-xs text-sucuk-700 font-medium">{usedModel}</span>
            </div>
          )}
          {limitExhausted && (
            <div className="p-2 rounded-md border border-red-100 bg-red-50 text-xs text-red-700">
              <AlertCircle className="mr-2 h-3 w-3" />
              {limitExhausted === true ? "Tüm API kotası tükendi." : ""}
            </div>
          )}
          <Button size="sm" variant="ghost" onClick={() => setStatus(null)} className="w-full text-left text-xs">
            <RefreshCw className="mr-2 h-3 w-3" /> Sağlayıcı durumunu yenile
          </Button>
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900">{chat?.title || "Sohbet"}</h1>
              <p className="text-xs text-slate-500">
                {usedProvider ? `${providerLabel(usedProvider)} • ${usedModel}` : "Hazır"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={limitExhausted ? "danger" : "default"}>
              {limitExhausted ? "Düz Sohbet Modu" : "Canlı"}
            </Badge>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <MessageCircle className="h-12 w-12 mb-3 opacity-50" />
              <p>Mesaj göndererek başlayın</p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "user" ? (
                <div className="flex flex-col gap-1">
                  <div className="max-w-[80%] rounded-2xl bg-sucuk-600 text-white p-4 shadow-lg">
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Sen • {new Date(msg.createdAt).toLocaleTimeString("tr-TR")}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="flex items-start gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 shrink-0">
                      <Bot className="h-3 w-3" />
                    </div>
                    <div className="max-w-[80%]">
                      <div className="rounded-2xl bg-slate-100 p-4 shadow-sm">
                        {msg.provider === "web-search" ? (
                          <div className="text-sm text-slate-700 whitespace-pre-line break-words border-l-2 border-sucuk-600 pl-3">
                            {msg.content}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-800 whitespace-pre-line break-words">
                            {msg.content}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 pt-1">
                        <span className="text-[10px] text-slate-500">
                          {msg.provider ? providerLabel(msg.provider) : "Asistan"}
                          {msg.model ? ` • ${msg.model}` : ""}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          • {new Date(msg.createdAt).toLocaleTimeString("tr-TR")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {status && (
          <div className="px-6 py-2 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
            <Info className="h-4 w-4 text-sucuk-600" />
            <span className="text-sm text-slate-600">{status}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 pb-4 pt-2 border-t border-slate-200 bg-white">
          <div className="flex items-end gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Mesaj yazın... (örn: python kodu yaz, bir resim çiz, web'de ara)"
              rows={1}
              maxRows={6}
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={sending || !input.trim()} className="h-auto px-6 py-4">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="pt-2 text-[11px] text-slate-400">
            Otomatik modda sistem görev türüne göre sağlayıcıyı seçer. Düz sohbet modunda
            aktif sağlayıcı modeli açıkça belirtilir.
          </p>
        </form>
      </main>
    </div>
  );
}
