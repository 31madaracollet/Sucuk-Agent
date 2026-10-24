"use client"

import { useEffect, useState } from "react"
import { Database, Shield, HardDrive, Plug, Bell, Palette, Trash2, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { INTEGRATIONS } from "@/lib/integrations"

const MODEL_TASKS: Record<string, string> = {
  google: "Genel / Çeviri — Gemini 3.8 Flash (beleş)",
  groq: "Kod & Arama — GPT-OSS 120B/20B (beleş)",
  openrouter: "Kod — Claude Sonnet 5.5",
  huggingface: "Görsel — FLUX.1/SDXL + Genel Qwen (beleş) + Prompt Guard + stok fallback",
  deepseek: "Akıl — Reasoner",
  kimi: "Kod uzun bağlam — Moonshot",
  nvidia: "Akıl — Nemotron (5 anahtar destekli)",
  openai: "Genel — GPT-4o",
}

export default function SettingsPage() {
  const [providers, setProviders] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [integrations, setIntegrations] = useState<any[]>([])
  const [theme, setTheme] = useState<"dark"|"light">("dark")

  useEffect(() => {
    fetch("/api/providers", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setProviders(data)
        setLoading(false)
      })
    fetch("/api/integrations", { credentials:"include"}).then(r=>r.json()).then(j=>setIntegrations(j.integrations??[]))
    const saved = localStorage.getItem("sucuk:theme") as any
    if(saved) setTheme(saved)
    else if(window.matchMedia("(prefers-color-scheme: light)").matches) setTheme("light")
  }, [])

  const toggleTheme = (t:"dark"|"light") => {
    setTheme(t)
    localStorage.setItem("sucuk:theme", t)
    document.documentElement.classList.toggle("light", t==="light")
    document.documentElement.classList.toggle("dark", t==="dark")
  }

  const exportPDF = async () => {
    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF()
    doc.text("Sucuk-Agent Ayarlar — Entegrasyon Raporu", 10, 10)
    doc.setFontSize(10)
    doc.text(`Tarih: ${new Date().toLocaleString("tr-TR")}`, 10, 18)
    let y=28
    for(const p of Object.entries(MODEL_TASKS)){
      doc.text(`${p[0]}: ${p[1]}`, 10, y); y+=7
    }
    doc.text("Entegrasyonlar:", 10, y+5); y+=12
    for(const i of INTEGRATIONS){ doc.text(`${i.label}: ${i.desc}`, 10, y); y+=6; if(y>280){doc.addPage(); y=15} }
    doc.save(`ayarlar-${Date.now()}.pdf`)
  }

  const runCleanup = async () => {
    if(!confirm("1 haftadır kullanılmayan sohbetler silinsin mi? (admin hariç)")) return
    const r = await fetch("/api/cleanup", { method:"POST", credentials:"include"})
    const j = await r.json()
    alert(`Silindi: ${j.deleted}, Admin korundu: ${j.skippedAdmin}`)
  }

  return (
    <>
      <Navbar/>
      <div className="flex">
        <Sidebar/>
        <div className="flex-1 mx-auto max-w-4xl px-4 md:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Ayarlar</h1>
        <p className="text-sm text-zinc-500">Kalıcı sohbet, araçlar ve bağlantılar, tema, yedek, temizlik</p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white"><Palette className="h-5 w-5" /> Tema (Dinamik)</CardTitle>
          <p className="text-xs text-zinc-500">Sistem temana otomatik uyum — beyaz (aydınlık) / siyah (karanlık)</p>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={()=>toggleTheme("dark")} variant={theme==="dark"?"default":"outline"} className={theme==="dark"?"bg-white text-black":""}>Karanlık</Button>
          <Button onClick={()=>toggleTheme("light")} variant={theme==="light"?"default":"outline"} className={theme==="light"?"bg-white text-black":""}>Aydınlık</Button>
          <span className="text-xs text-zinc-500 ml-2">Şu an: {theme} • prefers-color-scheme ile senkron</span>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white"><Plug className="h-5 w-5" /> Araçlar ve Bağlantılar</CardTitle>
          <p className="text-xs text-zinc-500">Supabase, GitHub, Drive, Notion, Haritalar, TeraBox, Workspace — ekle/çıkar, hepsi Agent tarafından kullanılır</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {INTEGRATIONS.map(i=>(
            <div key={i.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <div>
                <p className="text-sm font-medium text-white">{i.label}</p>
                <p className="text-xs text-zinc-500">{i.desc}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs ${integrations.some(t=>t.config?.provider===i.id) ? "bg-green-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>{integrations.some(t=>t.config?.provider===i.id) ? "Bağlı" : "Bekliyor"}</span>
            </div>
          ))}
          <p className="text-xs text-zinc-600">Yönetim: /workspace & /admin üzerinden eklenir. Supabase & Drive varsayılan aktif, TeraBox/Notion/Haritalar opsiyonel.</p>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white"><Database className="h-5 w-5" /> Sağlayıcı Durumu (5 anahtar/NVIDIA & HF destekli)</CardTitle>
          <p className="text-xs text-zinc-500">Agent kota bitince sıradaki beleşe geçer. Ek HF/NVIDIA anahtarları esnek — Vercel env'e ekle yeter.</p>
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
              {Object.keys(providers.keyCounts || {}).length === 0 && <p className="text-sm text-zinc-500">Anahtar yok. Vercel env ekle (HF/NVIDIA 5 anahtar destekli).</p>}
            </div>
          ) : <p className="text-zinc-500">Veri alınamadı.</p>}
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
        <CardHeader><CardTitle className="flex items-center gap-2 text-white"><Shield className="h-5 w-5" /> Cihaz & Kalıcılık</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <p className="text-xs tracking-widest text-zinc-500">KALICI SOHBET</p>
            <p className="text-sm text-zinc-400 mt-1">Sohbetler sebepsiz silinmez, Supabase'te kalıcı. 1 haftadır kullanılmayanlar <code>/api/cleanup</code> ile temizlenir (admin hariç).</p>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={runCleanup} className="rounded-full"><Trash2 className="h-4 w-4"/> Temizle (1 hafta kuralı)</Button>
              <Button size="sm" variant="outline" onClick={exportPDF} className="rounded-full"><Download className="h-4 w-4"/> PDF Rapor İndir</Button>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <p className="text-xs tracking-widest text-zinc-500">SİSTEM</p>
            <p className="text-sm text-zinc-400 mt-1">Tema otomatik (prefers-color-scheme), kod kutusu kopyala, PDF indir, yerleşik editör, stok görsel fallback, prompt guard, çoklu görev orchestration — hepsi aktif.</p>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </>
  )
}
