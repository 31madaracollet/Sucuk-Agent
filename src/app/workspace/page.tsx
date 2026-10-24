"use client"
import { useEffect, useState } from "react"
import { Database, Github, HardDrive, Table, Cloud, ExternalLink, Search, Globe, Check, Plug, FileSpreadsheet, MapPin, BookOpen, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { INTEGRATIONS as ALL_INTEGRATIONS } from "@/lib/integrations"

const ICON_MAP: Record<string, any> = {
  Database, Github, HardDrive, Table, Cloud, FileSpreadsheet, MapPin, BookOpen, FileText, Plug
}

export default function WorkspacePage() {
  const [integrations, setIntegrations] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchQ, setSearchQ] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [browseUrl, setBrowseUrl] = useState("")
  const [browseResult, setBrowseResult] = useState<any>(null)
  const [newProvider, setNewProvider] = useState("google_drive")
  const [newName, setNewName] = useState("")

  const [userName, setUserName] = useState<string>("")
  async function load() {
    const r = await fetch("/api/integrations", { credentials: "include" })
    const j = await r.json()
    setIntegrations(j.integrations ?? [])
    try {
      const me = await fetch("/api/auth/me", { credentials: "include" }).then(x=>x.json())
      if(me.authenticated) { setIsAdmin(me.user.role==="admin"); setUserName(me.user.username) }
    } catch {}
  }
  useEffect(()=>{ load() }, [])

  async function connect() {
    if (!newName.trim()) { alert("İsim gir"); return }
    const r = await fetch("/api/integrations", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ provider: newProvider, name: newName, config: { connectedAt: new Date().toISOString() } }), credentials:"include" })
    const j = await r.json()
    if (!r.ok) { alert(j.error); return }
    alert(j.integration ? `Baglandi: ${j.integration.name} (kullaniciya ozel: ${userName})` : "Baglandi")
    setNewName("")
    load()
  }
  async function doSearch() {
    if (!searchQ.trim()) return
    const r = await fetch(`/api/workspace?q=${encodeURIComponent(searchQ)}`, { credentials:"include" })
    const j = await r.json()
    setSearchResults(j.results ?? [])
  }
  async function doBrowse() {
    if (!browseUrl.trim()) return
    const r = await fetch("/api/workspace", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ url: browseUrl }), credentials:"include" })
    const j = await r.json()
    setBrowseResult(j.browse ?? null)
  }

  const [googleConnecting, setGoogleConnecting] = useState(false)
  async function autoConnectGoogle(){
    setGoogleConnecting(true)
    const providers = [
      { provider:"google_drive", name:`${userName} — Google Drive`},
      { provider:"google_workspace", name:`${userName} — Google Workspace (Docs/Sheets)`},
      { provider:"maps", name:`${userName} — Google Haritalar`},
      { provider:"github", name:`${userName} — GitHub (auto)`},
      { provider:"supabase", name:`${userName} — Supabase (auto)`},
    ]
    for(const pr of providers){
      try{
        await fetch("/api/integrations",{ method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ provider:pr.provider, name: pr.name, config:{ connectedAt: new Date().toISOString(), googleAuto:true, agentAccess:true } }), credentials:"include" })
      }catch{}
    }
    alert(`Google hesabi baglandi — Agent'lar otomatik erisiyor: ${providers.map(p=>p.provider).join(", ")} — sen zaten baglisin, onlar da baglandi`)
    setGoogleConnecting(false)
    load()
  }

  return (
    <>
      <Navbar/>
      <div className="flex">
        <Sidebar/>
        <div className="flex-1 mx-auto max-w-5xl px-4 md:px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2"><Plug className="h-5 w-5" /> Workspace & Entegrasyonlar</h1>
          <p className="text-sm text-zinc-500">GitHub/Supabase/Drive/Notion/Haritalar/Workspace/TeraBox — kullaniciya ozel baglama + kor gomulu hesaplar. Agent hepsini kullanir.</p>
        </div>
        <Button onClick={autoConnectGoogle} disabled={googleConnecting} className="rounded-full bg-blue-600 text-white hover:bg-blue-700">{googleConnecting ? "Bağlanıyor..." : "🔗 Google Hesabını Oto Bağla (Agent Direkt)"}</Button>
        <Button variant="outline" className="rounded-full" onClick={()=>window.open("/friends","_blank")}><ExternalLink className="h-4 w-4" /> Arkadaşlarla Proje</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {ALL_INTEGRATIONS.slice(0,9).map(int => {
          const Icon = (ICON_MAP[int.icon] || Plug)
          const connected = integrations.some(t => t.config?.provider===int.id || t.name?.toLowerCase().includes(int.label.toLowerCase()))
          return (
            <Card key={int.id} className={`border-zinc-800 ${connected ? "bg-zinc-900" : "bg-zinc-950 opacity-90"}`}>
              <CardHeader className="flex flex-row items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${int.color}`}><Icon className="h-5 w-5" /></div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm">{int.label}</CardTitle>
                  <p className="text-xs text-zinc-500 truncate">{int.desc}</p>
                </div>
                {connected && <span className="ml-auto rounded-full bg-green-600 px-2 py-0.5 text-xs text-white flex items-center gap-1"><Check className="h-3 w-3" /> Bağlı</span>}
              </CardHeader>
            </Card>
          )
        })}
      </div>

      <Card>
          <CardHeader><CardTitle className="flex items-center gap-2">Yeni Entegrasyon Bagla — Kullaniciya Ozel {userName && `(${userName})`}</CardTitle><p className="text-xs text-zinc-500">Her kullanici kendi hesabini baglar — baglanti sana ozel. Google oto-bagla butonu ile Drive/Workspace/Maps tek tikte agent'lara atanir (sen zaten baglisin, onlar da baglanir).</p></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <select value={newProvider} onChange={e=>setNewProvider(e.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white">
              <option value="supabase">Supabase</option>
              <option value="github">GitHub</option>
              <option value="google_drive">Google Drive</option>
              <option value="terabox">TeraBox</option>
              <option value="google_workspace">Google Workspace</option>
              <option value="notion">Notion</option>
              <option value="maps">Haritalar (Maps)</option>
              <option value="excel">Excel</option>
              <option value="vercel">Vercel</option>
              <option value="huggingface">HuggingFace ek</option>
              <option value="nvidia">NVIDIA ek</option>
              <option value="slack">Slack</option>
              <option value="discord">Discord</option>
            </select>
            <Input placeholder="Isim (orn. Kendi Drive, GitHub Repo)" value={newName} onChange={e=>setNewName(e.target.value)} className="flex-1 min-w-[200px]" />
            <Button onClick={connect} className="rounded-full bg-white text-black">Bagla — Sana Ozel</Button>
          </CardContent>
        </Card>

      <Card>
        <CardHeader><CardTitle>Bağlı Entegrasyonlar ({integrations.length})</CardTitle></CardHeader>
        <CardContent>
          {integrations.length===0 ? <p className="text-sm text-zinc-500">Henüz bağlı entegrasyon yok — admin eklesin. Supabase & Drive varsayılan aktif.</p> : (
            <div className="space-y-2">
              {integrations.map((t:any)=>(
                <div key={t.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                  <div>
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    <p className="text-xs text-zinc-500">{t.description} • {t.config?.provider}</p>
                  </div>
                  <span className="text-xs text-zinc-600">{new Date(t.createdAt).toLocaleString("tr-TR")}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" /> Web'de Ara</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="örn. güncel yapay zeka haberleri" value={searchQ} onChange={e=>setSearchQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSearch()} />
              <Button onClick={doSearch} className="rounded-full bg-white text-black">Ara</Button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {searchResults.map((r,i)=>(
                <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                  <a href={r.url} target="_blank" className="text-sm font-medium text-white hover:underline">{r.title}</a>
                  <p className="text-xs text-zinc-500 break-all">{r.url}</p>
                  <p className="text-xs text-zinc-400 mt-1">{r.snippet}</p>
                </div>
              ))}
              {searchResults.length===0 && <p className="text-xs text-zinc-600">Sonuç yok — ara.</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> URL'ye Gir</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="https://github.com/..." value={browseUrl} onChange={e=>setBrowseUrl(e.target.value)} />
              <Button onClick={doBrowse} className="rounded-full bg-white text-black">Çek</Button>
            </div>
            {browseResult && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 max-h-80 overflow-y-auto">
                <p className="text-sm font-medium text-white">{browseResult.title || "Sayfa"}</p>
                <p className="text-xs text-zinc-400 whitespace-pre-wrap break-words mt-2">{browseResult.text?.slice(0,4000)}</p>
              </div>
            )}
            {!browseResult && <p className="text-xs text-zinc-600">GitHub, Supabase docs vb. URL gir — Agent okuyup özetler.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-blue-900 bg-blue-950 p-3 text-xs text-blue-200">📁 Drive Oto Yedek Klasörü: <a href="https://drive.google.com/drive/folders/1WJxce63LuN_LO4Z85x2DXluL0PSDGues" target="_blank" className="underline">Sucuk-Agent-Sohbet-Yedekleri</a> — her mesaj Supabase'e yazılır, Drive'a oto yedeklenir. Orchestration: satış sitesi → FLUX görsel + DeepSeek kod + GitHub push + Vercel publish.</div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><HardDrive className="h-5 w-5" /> Sohbetler & Drive</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-zinc-400">Sohbetler Supabase'de kalıcı, sebzepsiz silinmez. 1 hafta kullanılmayan otomatik temizlenir (admin hariç) — <code>/api/cleanup</code>.</p>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-full" onClick={async()=>{ const r=await fetch("/api/drive",{credentials:"include"}); const j=await r.json(); const blob=new Blob([JSON.stringify(j.backup,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`drive-backup-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url)}}><HardDrive className="h-4 w-4" /> Drive'a Yedek İndir</Button>
            <Button variant="outline" className="rounded-full" onClick={()=>window.open("/dashboard","_blank")}>Sohbetlere Git</Button>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </>
  )
}
