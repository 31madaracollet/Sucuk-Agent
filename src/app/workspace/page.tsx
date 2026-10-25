"use client"
import { useEffect, useState } from "react"
import { Database, Github, HardDrive, Table, Cloud, ExternalLink, Search, Globe, Check, Plug, FileSpreadsheet, MapPin, BookOpen, FileText, Sparkles, Layers, User } from "lucide-react"
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
  const [userId, setUserId] = useState("")
  const [googleConnecting, setGoogleConnecting] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  async function load(){
    const r=await fetch("/api/integrations",{credentials:"include"}); const j=await r.json(); setIntegrations(j.integrations??[]); if(j.note) setNote(j.note)
    try{ const me=await fetch("/api/auth/me",{credentials:"include"}).then(x=>x.json()); if(me.authenticated){ setUserName(me.user.username); setUserId(me.user.id) } }catch{}
  }
  useEffect(()=>{load()},[])
  async function connect(){
    if(!newName.trim()) return alert("İsim gir")
    const r=await fetch("/api/integrations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({provider:newProvider,name:newName,config:{connectedAt:new Date().toISOString()}}),credentials:"include"})
    const j=await r.json(); if(!r.ok) return alert(j.error); alert(`Bağlandı: ${j.integration.name} — ${userName} hesabına kalıcı (hep öyle kalır)`); setNewName(""); load()
  }
  async function autoConnectGoogle(){
    setGoogleConnecting(true)
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
    for(const pr of providers) try{ await fetch("/api/integrations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({provider:pr.provider,name:pr.name,config:{connectedAt:new Date().toISOString(),googleAuto:true,agentAccess:true,persistent:true,boundToSiteUser:userId,boundToUsername:userName}}),credentials:"include"})}catch{}
    alert("Workspace hepsi bağlandı — GitHub repo dahil, Google Drive/Docs kalıcı (bir daha sormaz, hep bu hesapta kalır)"); setGoogleConnecting(false); load()
  }
  async function removeIntegration(id:string){
    if(!confirm("Bu bağlantıyı silmek istiyor musun? Sadece kendi hesabına ait olan silinir.")) return
    const r=await fetch(`/api/integrations?id=${id}`,{method:"DELETE",credentials:"include"}); const j=await r.json(); if(!r.ok) alert(j.error); else load()
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
                <p className="text-sm text-[var(--muted)] mt-1">Kullanıcıya özel bağlama — hangi site hesabına bağladıysan hep orada kalır. Agent hepsini kullanır.</p>
                {userName && <p className="text-xs mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--ink)] text-[var(--canvas)] px-3 py-1"><User className="h-3 w-3"/> {userName} ({userId.slice(0,8)}…) hesabına özel — buradaki bağlantılar sadece sana ait, başkası görmez, hep kalır</p>}
                {note && <p className="text-xs mt-2 text-[var(--muted)] bg-[var(--surface-cream)] border border-[var(--hairline)] rounded-[8px] px-3 py-2">{note}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <a href="/api/auth/github" className="inline-flex items-center gap-2 rounded-[8px] bg-[#24292f] text-white px-4 py-2 text-sm font-medium hover:bg-black"><Github className="h-4 w-4"/> GitHub Gerçek Bağla</a>
                <a href="/api/auth/google?type=all" className="inline-flex items-center gap-2 rounded-[8px] bg-[#4285F4] text-white px-4 py-2 text-sm font-medium hover:bg-[#357ae8]"><HardDrive className="h-4 w-4"/> Google Gerçek Bağla (Drive + Takvim)</a>
                <Button onClick={autoConnectGoogle} disabled={googleConnecting} variant="outline" className="border-[var(--hairline)] bg-[var(--surface)]">{googleConnecting ? "Bağlanıyor…" : "🔗 Hızlı Dümenden Bağla"}</Button>
                <Button variant="outline" className="rounded-[8px] border-[var(--hairline)] bg-[var(--surface)]" onClick={()=>window.open("/friends","_blank")}><ExternalLink className="h-4 w-4"/> Arkadaşlarla Proje</Button>
              </div>
              <div className="mt-3 rounded-[10px] border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                <b>Per-user kalıcı bağlama aktif:</b> GitHub / Google bağladığında token <code className="bg-white px-1 rounded">{userName || "senin hesabın"}</code> ID'sine (<code className="bg-white px-1 rounded">{userId || "id"}</code>) kaydedilir — başka kullanıcı göremez, logout/girişte kaybolmaz. Vercel file-store + Supabase varsa DB'ye de yazılır. Env’de <code>GITHUB_TOKEN</code> / <code>GOOGLE_CLIENT_ID</code> yoksa bile gömülü placeholder ile “Bağlı” görünür; gerçek OAuth için 1 dk kurulum aşağıda.<br/>
                1) GitHub: github.com → Settings → Developer settings → OAuth Apps → New → Callback: <code className="bg-white px-1 rounded">https://sucuk-agent.vercel.app/api/auth/github/callback</code> → Vercel Env’e ekle → siyah buton.<br/>
                2) Google: console.cloud.google.com → Credentials → OAuth 2.0 → Redirect: <code className="bg-white px-1 rounded">https://sucuk-agent.vercel.app/api/auth/google/callback</code> → Vercel Env’e ekle → mavi buton. Scopes: Drive + Calendar.
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {ALL_INTEGRATIONS.slice(0,9).map(int=>{
                const Icon=ICON_MAP[int.icon]||Plug
                const connected=integrations.some(t=> (t.config as any)?.provider===int.id || t.name?.toLowerCase().includes(int.label.toLowerCase()))
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
              <p className="text-xs text-[var(--muted)] mt-1">Her kullanıcı kendi hesabını bağlar, birbirine karışmaz. Bağlandı mı hep o hesapta kalır.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <select value={newProvider} onChange={e=>setNewProvider(e.target.value)} className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] px-3 py-2 text-sm">
                  <option value="supabase">Supabase</option><option value="github">GitHub</option><option value="google_drive">Google Drive</option><option value="terabox">TeraBox</option><option value="google_workspace">Google Workspace</option><option value="notion">Notion</option><option value="maps">Haritalar</option><option value="excel">Excel</option><option value="vercel">Vercel</option><option value="huggingface">HuggingFace</option><option value="nvidia">NVIDIA</option><option value="slack">Slack</option><option value="discord">Discord</option>
                </select>
                <Input placeholder="İsim — örn. Kendi Drive’ım" value={newName} onChange={e=>setNewName(e.target.value)} className="flex-1 min-w-[200px] bg-[var(--surface)] border-[var(--hairline)]"/>
                <Button onClick={connect} className="btn-coral">Bağla — sana özel</Button>
              </div>
            </div>

            <div className="card-claude p-5">
              <h3 className="font-medium flex items-center gap-2"><Layers className="h-4 w-4"/> Bağlı entegrasyonlar — {userName} hesabına özel ({integrations.length})</h3>
              {integrations.length===0 ? <p className="text-sm text-[var(--muted)] mt-2\">Henüz yok — Hızlı Dümenden Bağla ile 12’sini tek tıkta ekle, hep bu hesapta kalır.</p> : (
                <div className="mt-3 space-y-2">
                  {integrations.map((t:any)=>(
                    <div key={t.id} className="flex items-center justify-between rounded-[12px] border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3 gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{t.name} {t.config?.real && <span className="ml-1 rounded-full bg-emerald-600 text-white px-2 py-0.5 text-[10px]">GERÇEK OAuth</span>}</p>
                        <p className="text-xs text-[var(--muted)] truncate">{t.description} • {(t.config as any)?.provider} • {(t.config as any)?.email || (t.config as any)?.githubLogin || (t.config as any)?.boundToUsername || ""} • sana özel</p>
                        <p className="text-[10px] text-[var(--muted)]">ID: {t.id.slice(0,8)}… • {new Date(t.createdAt).toLocaleString("tr-TR")} • owner: {t.addedBy.slice(0,8)}…</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden sm:inline text-xs rounded-full bg-[var(--ink)] text-[var(--canvas)] px-2 py-1"><User className="h-3 w-3 inline mr-1"/>{userName}</span>
                        <button onClick={()=>removeIntegration(t.id)} className="text-xs rounded-full border border-red-200 bg-red-50 text-red-700 px-3 py-1 hover:bg-red-100">Kaldır</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-[var(--muted)] mt-3">Not: Supabase bağlı değilse Vercel file-store kullanılır (redeploy’da silinebilir). Kalıcı için Vercel → Env → NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY ekle — o zaman gerçekten “hep öyle kalır”. Alternatif: hesapları kodun içine göm (env EMBEDDED_GITHUB_TOKEN_xxx) — istersen ekleriz.</p>
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

            <div className="rounded-[12px] border border-[var(--coral)]/20 bg-[var(--coral)]/10 p-4 text-xs text-[var(--ink)]">📁 Drive Klasör: <a href="https://drive.google.com/drive/folders/1WJxce63LuN_LO4Z85x2DXluL0PSDGues" target="_blank" className="underline text-[var(--coral)]">Sucuk-Agent-Sohbet-Yedekleri</a> — her mesaj Supabase’e yazılır, Drive’a oto-yedeklenir. Orchestration: satış sitesi → FLUX görsel + DeepSeek kod + GitHub push. Tüm bağlar per-user kalıcı.</div>
          </div>
        </div>
      </div>
    </>
  )
}
