"use client"
import { useEffect, useState } from "react"
import { Database, Shield, HardDrive, Plug, Palette, Trash2, Download, Sun, Moon, Layers, Cpu, Zap, Check, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { INTEGRATIONS } from "@/lib/integrations"
import { useTheme } from "@/components/theme-provider"

const MODEL_TASKS: Record<string,string> = {
  google: "Çeviri + Doküman/Slayt birincil — Gemini (3 anahtar, kotası biterse sıradaki Google key → KIMI)",
  groq: "Arama birincil — GPT-OSS 120B/20B (3 anahtar rotasyon → Google/OpenRouter yedek)",
  openrouter: "Kod yedeği — Claude Sonnet 5.5 (3 anahtar)",
  huggingface: "Görsel birincil — FLUX.1-schnell (5 anahtar, kotası biterse sıradaki HF key) + Qwen-Image",
  deepseek: "Ağır mantık birincil — Reasoner (3 anahtar → NVIDIA 5 anahtar yedek)",
  kimi: "Çeviri yedek + Kod uzun bağlam — Moonshot 8K/32K (3 anahtar)",
  nvidia: "Ağır mantık yedeği — Nemotron 49B/70B (5 anahtar, DeepSeek biterse devreye girer)",
  openai: "Kod birincil + Doküman yedeği — GPT-4o/mini (3 anahtar → DeepSeek/NVIDIA yedek)",
}

export default function SettingsPage(){
  const [providers,setProviders]=useState<any>(null)
  const [loading,setLoading]=useState(true)
  const [integrations,setIntegrations]=useState<any[]>([])
  const {theme, toggle}=useTheme()

  useEffect(()=>{
    fetch("/api/providers",{credentials:"include"}).then(r=>r.json()).then(d=>{setProviders(d); setLoading(false)})
    fetch("/api/integrations",{credentials:"include"}).then(r=>r.json()).then(j=>setIntegrations(j.integrations??[]))
  },[])

  const exportPDF=async()=>{
    const {jsPDF}=await import("jspdf"); const doc=new jsPDF(); doc.text("Sucuk-Agent Ayarlar — Rapor",10,10); doc.setFontSize(10); doc.text(`Tarih: ${new Date().toLocaleString("tr-TR")}`,10,18); let y=28; for(const p of Object.entries(MODEL_TASKS)){ doc.text(`${p[0]}: ${p[1]}`,10,y); y+=7 } doc.text("Entegrasyonlar:",10,y+5); y+=12; for(const i of INTEGRATIONS){ doc.text(`${i.label}: ${i.desc}`,10,y); y+=6; if(y>280){doc.addPage(); y=15}} doc.save(`ayarlar-${Date.now()}.pdf`)
  }
  const runCleanup=async()=>{ if(!confirm("1 haftadır kullanılmayan sohbetler silinsin mi? (admin hariç)")) return; const r=await fetch("/api/cleanup",{method:"POST",credentials:"include"}); const j=await r.json(); alert(`Silindi: ${j.deleted}, Korundu: ${j.skippedAdmin}`)}

  return (
    <>
      <Navbar/>
      <div className="flex">
        <Sidebar/>
        <div className="flex-1 min-w-0 bg-[var(--canvas)]">
          <div className="mx-auto max-w-[900px] px-6 md:px-8 py-8 space-y-6">
            <div>
              <h1 className="font-display text-[28px] tracking-[-0.6px]">Ayarlar</h1>
              <p className="text-sm text-[var(--muted)]">Kalıcı sohbet, tema, görev dağılımı, sağlayıcı sağlığı — kota bitince sıradaki API devralır</p>
            </div>

            <div className="card-claude p-6">
              <h3 className="font-medium flex items-center gap-2"><Zap className="h-4 w-4 text-[var(--coral)]"/> Görev Dağılımı — her API ayrı iş (yeni)</h3>
              <p className="text-xs text-[var(--muted)] mt-1">Birin kotası bitince öbür API otomatik devralır. Her provider 3-5 anahtar rotasyonu ile çalışır. Aşağıda birincil + yedek zinciri.</p>
              {loading ? <p className="text-sm text-[var(--muted)] mt-4">Yükleniyor…</p> : providers?.taskDistribution ? (
                <div className="mt-4 space-y-2">
                  {Object.entries(providers.taskDistribution as any).map(([task, dist]: any)=>(
                    <div key={task} className="rounded-[12px] border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium capitalize flex items-center gap-2"><Cpu className="h-3 w-3 text-[var(--coral)]"/> {task} → <span className="text-[var(--coral)]">{dist.primary}</span></p>
                        <span className="text-xs text-[var(--muted)]">{dist.fallbacks.length} yedek</span>
                      </div>
                      <p className="text-xs text-[var(--muted)] mt-1">{dist.desc}</p>
                      <p className="text-xs mt-2 font-mono bg-[var(--surface)] border border-[var(--hairline)] rounded-[8px] px-2 py-1.5">{dist.primary} → {dist.fallbacks.join(" → ")}</p>
                    </div>
                  ))}
                  <p className="text-xs text-[var(--muted)] mt-2">Örnek: <b>kod</b> → openai kotası 429 verirse deepseek dener, o da doluysa nvidia, sonra groq… Görsel sadece huggingface 5 anahtar içinde döner.</p>
                </div>
              ) : <p className="text-sm text-[var(--muted)]">Veri yok</p>}
            </div>

            <div className="card-claude p-6">
              <h3 className="font-medium flex items-center gap-2"><Palette className="h-4 w-4 text-[var(--coral)]"/> Tema — Parchment vs Cihaz</h3>
              <p className="text-xs text-[var(--muted)] mt-1">Gündüz warm paper (#faf9f5), gece OLED ink (#141413). Cormorant + Inter, coral sadece CTA’da.</p>
              <div className="mt-4 flex gap-2 items-center">
                <button onClick={()=>toggle("light")} className={`flex items-center gap-2 rounded-[10px] border px-4 py-2.5 text-sm font-medium ${theme==="light" ? "bg-[var(--ink)] text-[var(--canvas)] border-transparent" : "bg-[var(--surface)] border-[var(--hairline)] hover:bg-[var(--surface-cream)]"}`}><Sun className="h-4 w-4"/> Aydınlık — Parchment</button>
                <button onClick={()=>toggle("dark")} className={`flex items-center gap-2 rounded-[10px] border px-4 py-2.5 text-sm font-medium ${theme==="dark" ? "bg-[var(--ink)] text-[var(--canvas)] border-transparent" : "bg-[var(--surface)] border-[var(--hairline)] hover:bg-[var(--surface-cream)]"}`}><Moon className="h-4 w-4"/> Karanlık — Cihaz</button>
                <span className="text-xs text-[var(--muted)] ml-2">Şu an: {theme}</span>
              </div>
            </div>

            <div className="card-claude p-6">
              <h3 className="font-medium flex items-center gap-2"><Plug className="h-4 w-4 text-[var(--coral)]"/> Entegrasyonlar — kullanıcıya özel</h3>
              <p className="text-xs text-[var(--muted)] mt-1">Supabase, GitHub, Drive, Notion, Haritalar — artifact’ta canlı, Google oto-bağla ile agent’a direkt.</p>
              <div className="mt-4 space-y-2">
                {INTEGRATIONS.map(i=>(
                  <div key={i.id} className="flex items-center justify-between rounded-[12px] border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3">
                    <div><p className="text-sm font-medium">{i.label}</p><p className="text-xs text-[var(--muted)]">{i.desc}</p></div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${integrations.some(t=>t.config?.provider===i.id) ? "bg-[var(--success)] text-white" : "bg-[var(--surface)] border border-[var(--hairline)] text-[var(--muted)]"}`}>{integrations.some(t=>t.config?.provider===i.id) ? "Bağlı" : "Bekliyor"}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-claude p-6">
              <h3 className="font-medium flex items-center gap-2"><Database className="h-4 w-4 text-[var(--coral)]"/> Sağlayıcı durumu — 3-5× anahtar, kota bitince sıradaki devreye girer</h3>
              <p className="text-xs text-[var(--muted)] mt-1">Her sağlayıcı kendi anahtarları içinde döner, bitince görev zincirinde sıradaki provider devralır. HF/NVIDIA 5 anahtar.</p>
              {loading ? <p className="text-sm text-[var(--muted)] mt-4">Yükleniyor…</p> : providers ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-[10px] border border-[var(--hairline)] bg-[var(--canvas-soft)] px-4 py-3 text-sm">
                    <span className="text-[var(--muted)]">Kimlik</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${providers.authenticated ? "bg-[var(--ink)] text-[var(--canvas)]" : "bg-red-100 text-red-700"}`}>{providers.authenticated ? "Oturum açık" : "Oturum yok"}</span>
                  </div>
                  {Object.entries(providers.keyCounts||{}).map(([p,c])=> {
                    const health = providers.keyHealth?.[p]
                    return (
                    <div key={p} className="rounded-[12px] border border-[var(--hairline)] bg-[var(--surface)] p-4">
                      <div className="flex items-center justify-between">
                        <div><p className="text-sm font-medium capitalize">{p}</p><p className="text-xs text-[var(--muted)]">{MODEL_TASKS[p]||""}</p></div>
                        <span className="rounded-full bg-[var(--ink)] text-[var(--canvas)] px-3 py-1 text-xs font-mono font-bold">{String(c)} anahtar</span>
                      </div>
                      {health && <p className="text-xs text-[var(--muted)] mt-1">Sağlıklı: {health.healthy}/{health.total} {health.exhausted.length>0 && <span className="text-red-600">• kota biten: {health.exhausted.join(", ")}</span>}</p>}
                    </div>
                  )})}
                  {Object.keys(providers.keyCounts||{}).length===0 && <p className="text-sm text-[var(--muted)]">Anahtar yok — Vercel env’e ekle.</p>}
                  <div className="rounded-[10px] border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    <b>Nasıl çalışır?</b> Örn. <code className="bg-white px-1 rounded">kod</code> → openai (key1→key2→key3) dener, hepsi 429 ise deepseek’e geçer, o da doluysa nvidia (5 key)… En son hata verirse Ayarlar’da teşhis görünür.
                  </div>
                </div>
              ) : <p className="text-sm text-[var(--muted)]">Veri alınamadı.</p>}
            </div>

            <div className="card-claude p-6">
              <h3 className="font-medium flex items-center gap-2"><Shield className="h-4 w-4 text-[var(--coral)]"/> Kalıcılık & temizlik</h3>
              <div className="mt-4 grid gap-3">
                <div className="rounded-[12px] border border-[var(--hairline)] bg-[var(--canvas-soft)] p-4">
                  <p className="text-xs tracking-[0.08em] font-semibold text-[var(--muted)]">KALICI SOHBET</p>
                  <p className="text-sm text-[var(--muted)] mt-1">Sebepsiz silinmez, Supabase’te kalıcı. 1 haftadır kullanılmayanlar <code className="font-mono text-xs bg-[var(--surface)] px-1 py-0.5 rounded">/api/cleanup</code> ile temizlenir (admin hariç).</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={runCleanup} className="rounded-full border border-[var(--hairline)] bg-[var(--surface)] hover:bg-[var(--surface-cream)]"><Trash2 className="h-4 w-4"/> Temizle (1 hafta)</Button>
                    <Button size="sm" onClick={exportPDF} className="rounded-full border border-[var(--hairline)] bg-[var(--surface)] hover:bg-[var(--surface-cream)]"><Download className="h-4 w-4"/> PDF rapor</Button>
                  </div>
                </div>
                <div className="rounded-[12px] border border-[var(--hairline)] bg-[var(--canvas-soft)] p-4">
                  <p className="text-xs tracking-[0.08em] font-semibold text-[var(--muted)]">SİSTEM</p>
                  <p className="text-sm text-[var(--muted)] mt-1">Parchment gündüz, ink gece. Hairline border, coral sadece CTA, serif başlık, sans metin, mono kod — AI slop yok.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
