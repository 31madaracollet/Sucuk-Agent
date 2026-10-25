"use client"
import { useEffect, useState } from "react"
import { Database, Github, HardDrive, Table, Cloud, ExternalLink, Search, Globe, Check, Plug, FileSpreadsheet, MapPin, BookOpen, FileText, Sparkles, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { INTEGRATIONS as ALL_INTEGRATIONS } from "@/lib/integrations"

const ICON_MAP: Record<string, any> = { Database, Github, HardDrive, Table, Cloud, FileSpreadsheet, MapPin, BookOpen, FileText, Plug }

export default function WorkspacePage() {
  const [integrations, setIntegrations] = useState<any[]>([])
  const [searchQ, setSearchQ] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [browseUrl, setBrowseUrl] = useState("")
  const [browseResult, setBrowseResult] = useState<any>(null)
  const [newProvider, setNewProvider] = useState("google_drive")
  const [newName, setNewName] = useState("")
  const [userName, setUserName] = useState("")
  const [googleConnecting, setGoogleConnecting] = useState(false)

  async function load(){
    const r=await fetch("/api/integrations",{credentials:"include"}); const j=await r.json(); setIntegrations(j.integrations??[])
    try{ const me=await fetch("/api/auth/me",{credentials:"include"}).then(x=>x.json()); if(me.authenticated) setUserName(me.user.username)}catch{}
  }
  useEffect(()=>{load()},[])
  async function connect(){
    if(!newName.trim()) return alert("İsim gir")
    const r=await fetch("/api/integrations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({provider:newProvider,name:newName,config:{connectedAt:new Date().toISOString()}}),credentials:"include"})
    const j=await r.json(); if(!r.ok) return alert(j.error); alert(`Bağlandı: ${j.integration.name} — sana özel (${userName})`); setNewName(""); load()
  }
  async function autoConnectGoogle(){
    setGoogleConnecting(true)
    // Görev 2: workspace hepsi + GitHub repo — tek tık kalıcı (kullanıcının hesabına bağlanır)
    const providers=[
      {provider:"google_drive",name:`${userName} — Google Drive (Kalıcı)`},
      {provider:"google_workspace",name:`${userName} — Google Docs/Sheets (Kalıcı)`},
      {provider:"maps",name:`${userName} — Google Haritalar`},
      {provider:"github",name:`${userName} — GitHub Repo (Kalıcı)`},
      {provider:"supabase",name:`${userName} — Supabase`},
      {provider:"notion",name:`${userName} — Notion`},
      {provider:"vercel",name:`${userName} — Vercel`},
      {provider:"huggingface",name:`${userName} — Hugging Face`},
      {provider:"nvidia",name:`${userName} — NVIDIA`},
      {provider:"slack",name:`${userName} — Slack`},
      {provider:"discord",name:`${userName} — Discord`},
      {provider:"excel",name:`${userName} — Excel/Sheets`},
    ]
    for(const pr of providers) try{ await fetch("/api/integrations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({provider:pr.provider,name:pr.name,config:{connectedAt:new Date().toISOString(),googleAuto:true,agentAccess:true,persistent:true}}),credentials:"include"})}catch{}
    alert("Workspace hepsi bağlandı — GitHub repo dahil, Google Drive/Docs kalıcı (bir daha sormaz)"); setGoogleConnecting(false); load()
  }
  async function doSearch(){ if(!searchQ.trim()) return; const r=await fetch(`/api/workspace?q=${encodeURIComponent(searchQ)}`,{credentials:"include"}); const j=await r.json(); setSearchResults(j.results??[]) }
  async function doBrowse(){ if(!browseUrl.trim()) return; const r=await fetch("/api/workspace",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:browseUrl}),credentials:"include"}); const j=await r.json(); setBrowseResult(j.browse??null) }

  return (
    <>
      <Navbar/>
      <div className="flex">
        <Sidebar/>
        <div className="flex-1 min-w-0 bg-[var(--canvas)]">
          <div className="mx-auto max-w-[1100px] px-6 md:px-8 py-8 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-[28px] tracking-[-0.6px] flex items-center gap-2"><Plug className="h-5 w-5 text-[var(--coral)]"/> Workspace & Entegrasyonlar</h1>
                <p className="text-sm text-[var(--muted)] mt-1">Kullanıcıya özel bağlama + kör gömülü hesaplar. Agent hepsini kullanır — artifact’te göster.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href="/api/auth/github" className="inline-flex items-center gap-2 rounded-[8px] bg-[#24292f] text-white px-4 py-2 text-sm font-medium hover:bg-black"><Github className="h-4 w-4"/> GitHub Gerçek Bağla</a>
                <a href="/api/auth/google?type=all" className="inline-flex items-center gap-2 rounded-[8px] bg-[#4285F4] text-white px-4 py-2 text-sm font-medium hover:bg-[#357ae8]"><HardDrive className="h-4 w-4"/> Google Gerçek Bağla (Drive + Takvim)</a>
                <Button onClick={autoConnectGoogle} disabled={googleConnecting} variant="outline" className="border-[var(--hairline)] bg-[var(--surface)]">{googleConnecting ? "Bağlanıyor…" : "🔗 Hızlı Dümenden Bağla"}</Button>
                <Button variant="outline" className="rounded-[8px] border-[var(--hairline)] bg-[var(--surface)]" onClick={()=>window.open("/friends","_blank")}><ExternalLink className="h-4 w-4"/> Arkadaşlarla Proje</Button>
              </div>
              <div className="mt-3 rounded-[10px] border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <b>Gerçek bağlama için senin yapman gereken (1 dk):</b><br/>
                1) GitHub: github.com → Settings → Developer settings → OAuth Apps → New → Callback: <code className="bg-white px-1 rounded">https://sucuk-agent.vercel.app/api/auth/github/callback</code> → Client ID/Secret’i Vercel Env’e ekle → sonra üstteki siyah buton.<br/>
                2) Google: console.cloud.google.com → APIs → Credentials → OAuth 2.0 → Authorized redirect: <code className="bg-white px-1 rounded">https://sucuk-agent.vercel.app/api/auth/google/callback</code> → Client ID/Secret’i Vercel Env’e ekle → mavi buton. Scopes: Drive + Calendar (Agenda).
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {ALL_INTEGRATIONS.slice(0,9).map(int=>{
                const Icon=ICON_MAP[int.icon]||Plug
                const connected=integrations.some(t=>t.config?.provider===int.id || t.name?.toLowerCase().includes(int.label.toLowerCase()))
                return (
                  <div key={int.id} className={`card-claude p-4 flex items-center gap-3 ${connected ? "border-[var(--coral)]/30" : ""}`}>
                    <div className={`h-10 w-10 rounded-[10px] grid place-items-center text-white ${int.color}`}><Icon className="h-5 w-5"/></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{int.label}</p>
                      <p className="text-xs text-[var(--muted)] truncate">{int.desc}</p>
                    </div>
                    {connected && <span className="rounded-full bg-[var(--success)] text-white px-2.5 py-1 text-xs flex items-center gap-1"><Check className="h-3 w-3"/> Bağlı</span>}
                  </div>
                )
              })}
            </div>

            <div className="card-claude p-5">
              <h3 className="font-medium flex items-center gap-2"><Sparkles className="h-4 w-4 text-[var(--coral)]"/> Yeni entegrasyon — sana özel {userName && `(${userName})`}</h3>
              <p className="text-xs text-[var(--muted)] mt-1">Her kullanıcı kendi hesabını bağlar. Google oto-bağla Drive/Workspace/Maps’i tek tıkta agent’lara atar.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <select value={newProvider} onChange={e=>setNewProvider(e.target.value)} className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] px-3 py-2 text-sm">
                  <option value="supabase">Supabase</option><option value="github">GitHub</option><option value="google_drive">Google Drive</option><option value="terabox">TeraBox</option><option value="google_workspace">Google Workspace</option><option value="notion">Notion</option><option value="maps">Haritalar</option><option value="excel">Excel</option><option value="vercel">Vercel</option><option value="huggingface">HuggingFace</option><option value="nvidia">NVIDIA</option><option value="slack">Slack</option><option value="discord">Discord</option>
                </select>
                <Input placeholder="İsim — örn. Kendi Drive’ım" value={newName} onChange={e=>setNewName(e.target.value)} className="flex-1 min-w-[200px] bg-[var(--surface)] border-[var(--hairline)]"/>
                <Button onClick={connect} className="btn-coral">Bağla — sana özel</Button>
              </div>
            </div>

            <div className="card-claude p-5">
              <h3 className="font-medium flex items-center gap-2"><Layers className="h-4 w-4"/> Bağlı entegrasyonlar ({integrations.length})</h3>
              {integrations.length===0 ? <p className="text-sm text-[var(--muted)] mt-2">Henüz yok — Supabase & Drive varsayılan aktif.</p> : (
                <div className="mt-3 space-y-2">
                  {integrations.map((t:any)=>(
                    <div key={t.id} className="flex items-center justify-between rounded-[12px] border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3">
                      <div>
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-[var(--muted)]">{t.description} • {t.config?.provider}</p>
                      </div>
                      <span className="text-xs text-[var(--muted)]">{new Date(t.createdAt).toLocaleString("tr-TR")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="card-claude p-5">
                <h3 className="font-medium flex items-center gap-2"><Search className="h-4 w-4"/> Web’de Ara</h3>
                <div className="mt-3 flex gap-2">
                  <Input placeholder="güncel yapay zeka haberleri" value={searchQ} onChange={e=>setSearchQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSearch()} className="bg-[var(--surface)] border-[var(--hairline)]"/>
                  <Button onClick={doSearch} className="btn-coral">Ara</Button>
                </div>
                <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
                  {searchResults.map((r,i)=>(
                    <a key={i} href={r.url} target="_blank" className="block rounded-[12px] border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3 hover:border-[var(--coral)]">
                      <p className="text-sm font-medium text-[var(--ink)] hover:underline">{r.title}</p>
                      <p className="text-xs text-[var(--muted)] break-all">{r.url}</p>
                      <p className="text-xs text-[var(--ink-soft)] mt-1">{r.snippet}</p>
                    </a>
                  ))}
                  {searchResults.length===0 && <p className="text-xs text-[var(--muted)]">Sonuç yok — ara.</p>}
                </div>
              </div>
              <div className="card-claude p-5">
                <h3 className="font-medium flex items-center gap-2"><Globe className="h-4 w-4"/> URL’ye Gir</h3>
                <div className="mt-3 flex gap-2">
                  <Input placeholder="https://github.com/..." value={browseUrl} onChange={e=>setBrowseUrl(e.target.value)} className="bg-[var(--surface)] border-[var(--hairline)]"/>
                  <Button onClick={doBrowse} className="btn-coral">Çek</Button>
                </div>
                {browseResult ? <div className="mt-4 rounded-[12px] border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3 max-h-80 overflow-auto"><p className="text-sm font-medium">{browseResult.title||"Sayfa"}</p><p className="text-xs text-[var(--muted)] whitespace-pre-wrap break-words mt-2">{browseResult.text?.slice(0,4000)}</p></div> : <p className="text-xs text-[var(--muted)] mt-4">GitHub/Supabase docs URL gir — agent özetler, artifact’te gösterir.</p>}
              </div>
            </div>

            <div className="rounded-[12px] border border-[var(--coral)]/20 bg-[var(--coral)]/10 p-4 text-xs text-[var(--ink)]">📁 Drive Klasör: <a href="https://drive.google.com/drive/folders/1WJxce63LuN_LO4Z85x2DXluL0PSDGues" target="_blank" className="underline text-[var(--coral)]">Sucuk-Agent-Sohbet-Yedekleri</a> — her mesaj Supabase’e yazılır, Drive’a oto-yedeklenir. Orchestration: satış sitesi → FLUX görsel + DeepSeek kod + GitHub push.</div>
          </div>
        </div>
      </div>
    </>
  )
}
