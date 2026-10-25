"use client"
import { useEffect, useState } from "react"
import { Database, Shield, HardDrive, Plug, Palette, Trash2, Download, Sun, Moon, Layers, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { INTEGRATIONS } from "@/lib/integrations"
import { useTheme } from "@/components/theme-provider"

const MODEL_TASKS: Record<string,string> = {
  google: "Genel/Çeviri/Döküman — Gemini 3.8 Flash (Görev 1+2)",
  groq: "Kod & Arama — GPT-OSS 120B/20B",
  openrouter: "Kod — Claude Sonnet 5.5",
  huggingface: "Görsel — FLUX.1-schnell + Qwen-Image (her prompt İngilizceye çevrilir) + No logo",
  deepseek: "Ağır mantık — Reasoner (Görev 3)",
  kimi: "Kod uzun bağlam — Moonshot",
  nvidia: "Ağır mantık yedeği — Nemotron 5 anahtar (Görev 3)",
  openai: "Yazı/Döküman/Slayt — GPT-4o (Görev 2: Gemini/OpenAI)",
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
              <p className="text-sm text-[var(--muted)]">Kalıcı sohbet, tema, entegrasyonlar, sağlayıcı sağlığı — Claude design system ile</p>
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
              <h3 className="font-medium flex items-center gap-2"><Database className="h-4 w-4 text-[var(--coral)]"/> Sağlayıcı durumu — 3× anahtar, yedek beleş</h3>
              <p className="text-xs text-[var(--muted)] mt-1">Kota bitince sessizce yedeğe geçer. HF/NVIDIA 5 anahtar desteği.</p>
              {loading ? <p className="text-sm text-[var(--muted)] mt-4">Yükleniyor…</p> : providers ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-[10px] border border-[var(--hairline)] bg-[var(--canvas-soft)] px-4 py-3 text-sm">
                    <span className="text-[var(--muted)]">Kimlik</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${providers.authenticated ? "bg-[var(--ink)] text-[var(--canvas)]" : "bg-red-100 text-red-700"}`}>{providers.authenticated ? "Oturum açık" : "Oturum yok"}</span>
                  </div>
                  {Object.entries(providers.keyCounts||{}).map(([p,c])=>(
                    <div key={p} className="flex items-center justify-between rounded-[12px] border border-[var(--hairline)] bg-[var(--surface)] p-4">
                      <div><p className="text-sm font-medium capitalize">{p}</p><p className="text-xs text-[var(--muted)]">{MODEL_TASKS[p]||""}</p></div>
                      <span className="rounded-full bg-[var(--ink)] text-[var(--canvas)] px-3 py-1 text-xs font-mono font-bold">{String(c)} anahtar</span>
                    </div>
                  ))}
                  {Object.keys(providers.keyCounts||{}).length===0 && <p className="text-sm text-[var(--muted)]">Anahtar yok — Vercel env’e ekle.</p>}
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
