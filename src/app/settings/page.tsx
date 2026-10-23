"use client"

import { useEffect, useState } from "react"
import { Database, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const MODEL_TASKS: Record<string, string> = {
  google: "Genel / Çeviri — Gemini 3.8 Flash (beleş)",
  groq: "Kod & Arama — GPT-OSS 120B/20B (beleş)",
  openrouter: "Kod — Claude Sonnet 5.5",
  huggingface: "Görsel — FLUX.1/SDXL + Genel Qwen (beleş)",
  deepseek: "Akıl — Reasoner",
  kimi: "Kod uzun bağlam — Moonshot",
  nvidia: "Akıl — Nemotron",
  openai: "Genel — GPT-4o",
}

export default function SettingsPage() {
  const [providers, setProviders] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/providers", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setProviders(data)
        setLoading(false)
      })
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Ayarlar</h1>
        <p className="text-sm text-zinc-500">Siyah-beyaz cihaz, beleş öncelikli modeller, Supabase + Drive</p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white"><Database className="h-5 w-5" /> Sağlayıcı Durumu</CardTitle>
          <p className="text-xs text-zinc-500">Agent kota bitince sıradaki beleşe geçer. Düz modda sen seçersin, yedek otomatik.</p>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-zinc-500">Yükleniyor...</p> : providers ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-sm">
                <span className="text-zinc-400">Kimlik</span>
                <Badge variant={providers.authenticated ? "success" : "danger"} className={providers.authenticated ? "bg-white text-black" : "bg-red-950 text-red-200 border-red-900"}>
                  {providers.authenticated ? "Oturum açtı" : "Oturum yok"}
                </Badge>
              </div>
              <p className="text-xs font-semibold tracking-widest text-zinc-500">SAĞLAYICILAR — ANAHTAR SAYISI & GÖREV</p>
              {Object.entries(providers.keyCounts || {}).map(([p, c]) => (
                <div key={p} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                  <div>
                    <span className="text-sm font-medium text-white capitalize">{p}</span>
                    <p className="text-xs text-zinc-500">{MODEL_TASKS[p] || ""}</p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-mono font-bold text-black">{String(c)} anahtar</span>
                </div>
              ))}
              {Object.keys(providers.keyCounts || {}).length === 0 && <p className="text-sm text-zinc-500">Anahtar yok. Vercel env ekle.</p>}
              <p className="text-xs text-zinc-500">Tüm beleş modellere görev verildi: Groq 20B (genel), Groq 120B (kod/arama), FLUX (görsel), Gemini (çeviri), Qwen (genel).</p>
            </div>
          ) : <p className="text-zinc-500">Veri alınamadı.</p>}
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
        <CardHeader><CardTitle className="flex items-center gap-2 text-white"><Shield className="h-5 w-5" /> Cihaz Teması</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <p className="text-xs tracking-widest text-zinc-500">TEMA</p>
              <p className="text-sm font-medium text-white mt-1">Siyah • Beyaz • Cihaz</p>
              <p className="text-xs text-zinc-500">OLED siyah (#09090b), beyaz kontrast, yumuşak akış — normal AI gibi.</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <p className="text-xs tracking-widest text-zinc-500">ORTAK KULLANIM</p>
              <p className="text-sm font-medium text-white mt-1">Herkes aynı Agent</p>
              <p className="text-xs text-zinc-500">Admin kullanıcı ekler/çıkarır, arkadaşlar DM, duyurular herkese.</p>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <p className="text-xs tracking-widest text-zinc-500">YEDEK</p>
            <p className="text-sm text-zinc-400 mt-1">Sohbetler Supabase'e yazılır, geçmiş kalıcı. Dashboard & DM'de "Drive'a Yedekle" ile JSON indir → Google Drive'a yükle.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
