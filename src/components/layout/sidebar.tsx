"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { MessageCircle, Plus, ChevronLeft, ChevronRight, User, X, Sparkles, Search, FileCode, Layers, Github, HardDrive, Check, ExternalLink, RefreshCw, Cloud, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useIsMobile } from "@/hooks/use-mobile"

export function Sidebar({ collapsedDefault = false }: { collapsedDefault?: boolean }) {
  const [collapsed, setCollapsed] = useState(collapsedDefault)
  const [chats, setChats] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [q, setQ] = useState("")
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [mobileOpen, setMobileOpen] = useState(false)
  // — GitHub / Drive per-user states (seninki gibi) —
  const [repos, setRepos] = useState<any[]>([])
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null)
  const [reposLoading, setReposLoading] = useState(false)
  const [reposError, setReposError] = useState<string | null>(null)
  const [githubConnected, setGithubConnected] = useState<boolean | null>(null)
  const [githubLogin, setGithubLogin] = useState<string>("")
  const [driveFiles, setDriveFiles] = useState<any[]>([])
  const [driveLoading, setDriveLoading] = useState(false)
  const [driveOk, setDriveOk] = useState<boolean | null>(null)
  const [driveNote, setDriveNote] = useState<string>("")
  const [driveRealAccount, setDriveRealAccount] = useState<string>("")

  // per-user anahtarlar — karışmayı önle, silinen tamamen gider
  function chatsKey(uid:string){ return `sucuk:chats:${uid}` }
  function chatKey(uid:string, cid:string){ return `sucuk:chat:${uid}:${cid}` }
  function msgsKey(uid:string, cid:string){ return `sucuk:msgs:${uid}:${cid}` }
  function deletedKey(uid:string){ return `sucuk:deleted:${uid}` }

  async function loadUserAndReturnId(): Promise<string|null>{
    try{ const r=await fetch("/api/auth/me",{credentials:"include"}); const j=await r.json(); if(j.authenticated){ setUser({u:j.user.username,r:j.user.role,id:j.user.id}); setNewUsername(j.user.username); return j.user.id } }catch{}
    return null
  }

  useEffect(()=>{
    const init=async()=>{ const uid=await loadUserAndReturnId(); await loadChats(uid); if(uid){ loadRepos(); loadDrive(); loadSelectedRepo() } }
    init()
    const onChatsChanged=async()=>{ const uid=user?.id ?? await loadUserAndReturnId(); loadChats(uid) }
    window.addEventListener("sucuk:chatsChanged", onChatsChanged as any)
    const onVis=async()=>{ if(document.visibilityState==="visible"){ const uid=user?.id ?? await loadUserAndReturnId(); loadChats(uid) } }
    document.addEventListener("visibilitychange",onVis)
    // repo/drive refresh eventleri
    const onRepoChanged=()=>{ loadRepos(); loadSelectedRepo() }
    const onDriveChanged=()=> loadDrive()
    window.addEventListener("sucuk:repoChanged", onRepoChanged as any)
    window.addEventListener("sucuk:driveChanged", onDriveChanged as any)
    return()=>{ window.removeEventListener("sucuk:chatsChanged",onChatsChanged as any); document.removeEventListener("visibilitychange",onVis); window.removeEventListener("sucuk:repoChanged", onRepoChanged as any); window.removeEventListener("sucuk:driveChanged", onDriveChanged as any)}
  },[])

  // — Yandan repo seç (seninki gibi) + Drive seninki gibi bağlansın —
  async function loadRepos(){
    setReposLoading(true); setReposError(null)
    try{
      const r=await fetch("/api/github/repos",{credentials:"include"})
      const j=await r.json()
      if(j.connected===false){ setGithubConnected(false); setRepos([]); setReposError(j.note || "GitHub bağlı değil") }
      else if(j.ok){ setGithubConnected(true); setRepos(j.repos||[]); setGithubLogin(j.context?.bindings?.[0]?.login || "") }
      else { setGithubConnected(!!j.connected); setRepos(j.repos||[]); if(j.error) setReposError(j.error) }
    }catch(e:any){ setReposError(e.message)}
    finally{ setReposLoading(false)}
  }
  async function loadSelectedRepo(){
    try{ const r=await fetch("/api/github/selected",{credentials:"include"}); const j=await r.json(); if(j.selected) setSelectedRepo(j.selected)}catch{}
  }
  async function selectRepo(fullName:string){
    try{
      const r=await fetch("/api/github/selected",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({repoFullName: fullName}),credentials:"include"})
      const j=await r.json()
      if(r.ok){ setSelectedRepo(fullName); window.dispatchEvent(new CustomEvent("sucuk:repoChanged")); window.dispatchEvent(new CustomEvent("sucuk:chatsChanged")) }
      else alert(j.error||"Seçilemedi")
    }catch(e:any){ alert(e.message)}
  }
  async function loadDrive(){
    setDriveLoading(true)
    try{
      const r=await fetch("/api/drive/files",{credentials:"include"})
      const j=await r.json()
      setDriveOk(!!j.ok && (j.files?.length>0 || j.source?.includes("drive")))
      setDriveFiles(j.files||[])
      setDriveNote(j.note||"")
      setDriveRealAccount(j.realAccount||"")
      if(j.ok===false && !j.files?.length) setDriveOk(false)
    }catch(e:any){ setDriveNote(e.message); setDriveOk(false) }
    finally{ setDriveLoading(false) }
  }

  async function loadChats(passedUid?:string|null){
    let uid = passedUid ?? user?.id ?? null
    if(!uid){
      try{ const r=await fetch("/api/auth/me",{credentials:"include"}); const j=await r.json(); if(j.authenticated) uid=j.user.id }catch{}
    }
    // hesap değiştiyse eski sohbetleri anında temizle — karışmayı kes
    if(uid){
      try{
        // eğer önceki yüklenen uid farklıysa state'i sıfırla
        if(user?.id && uid !== user.id) setChats([])
        // başka kullanıcıya ait global kalmışsa hemen sil, sadece bu uid'yi göster
        localStorage.removeItem("sucuk:chats")
      }catch{}
    }
    try{
      const r=await fetch("/api/chat",{credentials:"include"}); const j=await r.json(); const server=j.chats??[]
      // server zaten per-user filtreli (user_id eq), ama ekstra güvenlik: sadece bu uid'nin sohbetlerini al
      const filteredServer = uid ? server.filter((c:any)=> !c.userId || c.userId===uid || c.user_id===uid) : server
      if(!uid){
        setChats(filteredServer)
        return
      }
      const perKey=chatsKey(uid)
      const dKey=deletedKey(uid)
      try{
        localStorage.removeItem("sucuk:chats")
        for(let i=localStorage.length-1;i>=0;i--){
          const k=localStorage.key(i); if(!k) continue
          if((k.startsWith("sucuk:chat:") && !k.startsWith(`sucuk:chat:${uid}:`)) || (k.startsWith("sucuk:msgs:") && !k.startsWith(`sucuk:msgs:${uid}:`))){
            if(k==="sucuk:chat:" ) continue
            const parts=k.split(":")
            if(k.startsWith("sucuk:chat:") && parts.length===3) localStorage.removeItem(k)
            if(k.startsWith("sucuk:msgs:") && parts.length===3) localStorage.removeItem(k)
          }
        }
      }catch{}
      let lsChats:any[]=[]
      try{
        const raw=localStorage.getItem(perKey); lsChats=raw?JSON.parse(raw):[]
        // sadece bu kullanıcıya ait LS kayıtlarını al — userId kontrol
        lsChats = lsChats.filter((c:any)=> !c.userId || c.userId===uid)
        const delRaw=localStorage.getItem(dKey); const deletedIds=delRaw?JSON.parse(delRaw):[]
        lsChats=lsChats.filter((c:any)=> !deletedIds.includes(c.id))
      }catch{ lsChats=[] }
      const merged=[...filteredServer]
      for(const lc of lsChats){ if(!merged.find((c:any)=>c.id===lc.id)) merged.push(lc) }
      try{
        const delRaw2=localStorage.getItem(dKey); const deletedIds2=delRaw2?JSON.parse(delRaw2):[]
        const finalMerged=merged.filter((c:any)=> !deletedIds2.includes(c.id))
        setChats(finalMerged)
        try{
          localStorage.setItem(perKey, JSON.stringify(finalMerged))
          for(const c of finalMerged){
            try{ localStorage.setItem(chatKey(uid,c.id), JSON.stringify(c)) }catch{}
          }
        }catch{}
        return
      }catch{}
      setChats(merged)
      try{ localStorage.setItem(perKey, JSON.stringify(merged)) }catch{}
    }catch{
      try{ if(uid){ const perKey=chatsKey(uid); const ls=localStorage.getItem(perKey); if(ls) setChats(JSON.parse(ls)) } }catch{}
    }
  }


  async function createNewChat(){
    try{
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:"Yeni Sohbet"}),credentials:"include"}); const data=await res.json(); if(!res.ok){alert(data.error||"Oluşturulamadı"); return}
      if(data.chat){
        try{
          let uid=user?.id
          if(!uid){ const r=await fetch("/api/auth/me",{credentials:"include"}); const j=await r.json(); if(j.authenticated) uid=j.user.id }
          if(uid){
            const perKey=chatsKey(uid); const ls=localStorage.getItem(perKey); const arr=ls?JSON.parse(ls):[]; arr.unshift(data.chat); localStorage.setItem(perKey, JSON.stringify(arr)); localStorage.setItem(chatKey(uid,data.chat.id), JSON.stringify(data.chat)); localStorage.setItem(msgsKey(uid,data.chat.id), JSON.stringify([]))
            try{ const dKey=deletedKey(uid); const raw=localStorage.getItem(dKey); if(raw){ let del=JSON.parse(raw); del=del.filter((x:string)=>x!==data.chat.id); localStorage.setItem(dKey, JSON.stringify(del)) } }catch{}
          }
        }catch{}
        router.push(`/chat/${data.chat.id}`)
      }
      let uid2=user?.id
      if(!uid2){ try{ const r=await fetch("/api/auth/me",{credentials:"include"}); const j=await r.json(); if(j.authenticated) uid2=j.user.id }catch{} }
      loadChats(uid2); window.dispatchEvent(new CustomEvent("sucuk:chatsChanged"))
    }catch(e:any){alert("Hata: "+e.message)}
  }
  async function saveProfile(){ if(!newUsername.trim()) return; const r=await fetch("/api/profile",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:newUsername}),credentials:"include"}); if(r.ok){alert("Profil güncellendi"); setShowProfile(false); location.reload()} else alert("Güncellenemedi") }

  const filteredChats = chats.filter(c=> !q || c.title.toLowerCase().includes(q.toLowerCase()))

  if(isMobile){
    return (
      <>
        <button onClick={()=>setMobileOpen(true)} className="fixed bottom-5 left-5 z-30 lg:hidden flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ink)] text-[var(--canvas)] shadow-lg border border-[var(--hairline)]">
          <MessageCircle className="h-5 w-5"/>
        </button>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={()=>setMobileOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-[88vw] max-w-[340px] bg-[var(--canvas)] border-r border-[var(--hairline)] flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[var(--hairline)] flex items-center justify-between">
                <span className="font-display text-[16px]">Sohbetler</span>
                <button onClick={()=>setMobileOpen(false)} className="p-2 rounded-full hover:bg-[var(--surface-cream)]"><X className="h-4 w-4"/></button>
              </div>
              <div className="p-3"><button onClick={async()=>{await createNewChat(); setMobileOpen(false)}} className="w-full btn-coral flex items-center justify-center gap-2"><Plus className="h-4 w-4"/> Yeni Sohbet</button></div>
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                <div>
                  <p className="text-[10px] tracking-[0.12em] text-[var(--muted)] font-medium">SOHBETLER</p>
                  <div className="mt-2 space-y-1">
                    {filteredChats.slice(0,20).map((c:any)=>(
                      <Link key={c.id} href={`/chat/${c.id}`} onClick={()=>setMobileOpen(false)} className={`block rounded-[10px] px-3 py-2.5 text-[14px] leading-tight ${pathname===`/chat/${c.id}` ? "bg-[var(--ink)] text-[var(--canvas)]" : "bg-[var(--surface)] border border-[var(--hairline-soft)] text-[var(--ink-soft)] hover:border-[var(--hairline)]"}`}>
                        {c.title}
                      </Link>
                    ))}
                    {chats.length===0 && <p className="text-xs text-[var(--muted)]">Henüz yok</p>}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.12em] text-[var(--muted)] font-medium">REPOLAR — yandan seç</p>
                  <div className="mt-2 rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-2">
                    {githubConnected===false ? <a href="/api/auth/github" className="block text-xs text-center rounded-[8px] bg-[#24292f] text-white py-2">GitHub Bağla</a> : selectedRepo ? <p className="text-xs truncate">✅ {selectedRepo}</p> : <p className="text-xs text-[var(--muted)]">Repolar yükleniyor…</p> }
                  </div>
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.12em] text-[var(--muted)] font-medium">DRIVE — seninki gibi</p>
                  <div className="mt-2 rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-2">
                    {driveOk ? <p className="text-xs">✅ {driveRealAccount || "Bağlı"} — {driveFiles.length} dosya</p> : <a href="/api/auth/google?type=all" className="block text-xs text-center rounded-[8px] bg-[#4285F4] text-white py-2">Drive Bağla</a>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  if(collapsed){
    return (
      <div className="w-[68px] shrink-0 border-r border-[var(--hairline)] bg-[var(--canvas)] flex flex-col items-center py-4 gap-3 sticky top-[64px] h-[calc(100vh-64px)]">
        <button onClick={()=>setCollapsed(false)} className="p-2.5 rounded-[10px] bg-[var(--ink)] text-[var(--canvas)]"><ChevronRight className="h-4 w-4"/></button>
        <button onClick={createNewChat} className="p-2.5 rounded-[10px] bg-[var(--surface)] border border-[var(--hairline)] hover:bg-[var(--surface-cream)]"><Plus className="h-4 w-4"/></button>
        <Link href="/dashboard" className={`p-2.5 rounded-[10px] border ${pathname.startsWith("/dashboard")||pathname.startsWith("/chat")?"bg-[var(--ink)] text-[var(--canvas)] border-transparent":"bg-[var(--surface)] text-[var(--muted)] border-[var(--hairline)]"}`}><MessageCircle className="h-4 w-4"/></Link>

        <Link href="/editor" className="p-2.5 rounded-[10px] bg-[var(--surface)] border border-[var(--hairline)] text-[var(--muted)]"><FileCode className="h-4 w-4"/></Link>
        <div className="mt-auto h-8 w-8 rounded-full bg-[var(--ink)] text-[var(--canvas)] grid place-items-center text-xs font-bold">{user?.u?.[0]?.toUpperCase() ?? "?"}</div>
      </div>
    )
  }

  return (
    <div className="w-[280px] shrink-0 border-r border-[var(--hairline)] bg-[var(--canvas)] flex flex-col h-[calc(100vh-64px)] sticky top-[64px]">
      <div className="p-4 border-b border-[var(--hairline)]">
        <button onClick={createNewChat} className="w-full btn-coral flex items-center justify-center gap-2">
          <Plus className="h-4 w-4"/> Yeni sohbet
        </button>
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]"/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Sohbetlerde ara..." className="w-full rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] pl-9 pr-3 py-2 text-sm placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/20 focus:border-[var(--coral)]"/>
        </div>
        <button onClick={()=>setCollapsed(true)} className="mt-2 w-full flex items-center justify-center gap-1 rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--surface-cream)]"><ChevronLeft className="h-3 w-3"/> Daralt</button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        <section>
          <p className="text-[10px] tracking-[0.12em] font-semibold text-[var(--muted)] flex items-center gap-2"><Sparkles className="h-3 w-3"/> SOHBETLER</p>
          <div className="mt-2 space-y-1">
            {filteredChats.length===0 ? <p className="text-xs text-[var(--muted)] py-6 text-center">Henüz sohbet yok. Yeni sohbet başlat.</p> : filteredChats.slice(0,24).map((c:any)=>(
              <Link key={c.id} href={`/chat/${c.id}`} className={`group flex items-center gap-2 rounded-[10px] px-3 py-2.5 text-[14px] leading-tight border transition ${pathname===`/chat/${c.id}` ? "bg-[var(--ink)] text-[var(--canvas)] border-transparent" : "bg-[var(--surface)] border-[var(--hairline-soft)] text-[var(--ink-soft)] hover:bg-[var(--surface-cream)] hover:border-[var(--hairline)] hover:text-[var(--ink)]"}`}>
                <span className="truncate flex-1">{c.title}</span>
                <span className={`hidden group-hover:inline text-[10px] px-1.5 py-0.5 rounded-full ${pathname===`/chat/${c.id}`?"bg-white/20 text-white":"bg-[var(--ink)] text-[var(--canvas)]"}`}>›</span>
              </Link>
            ))}
          </div>
        </section>

        {/* — YANDAN REPO SEÇ (seninki gibi) — */}
        <section className="rounded-[12px] border border-[var(--hairline)] bg-[var(--surface)] p-3">
          <p className="text-[10px] tracking-[0.12em] font-semibold text-[var(--muted)] flex items-center gap-2"><Github className="h-3 w-3"/> REPOLAR — yandan seç</p>
          {selectedRepo && <p className="mt-2 text-xs rounded-[8px] bg-[var(--ink)] text-[var(--canvas)] px-2.5 py-1.5 truncate">✅ Seçili: {selectedRepo}</p>}
          {reposLoading ? (
            <p className="text-xs text-[var(--muted)] mt-2 flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin"/> Repolar yükleniyor…</p>
          ) : githubConnected===false ? (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-[var(--muted)]">GitHub henüz bu hesaba bağlı değil — seninki gibi bağla, per-user kalır.</p>
              <a href="/api/auth/github" className="flex items-center justify-center gap-2 rounded-[8px] bg-[#24292f] text-white px-3 py-2 text-xs font-medium hover:bg-black"><Github className="h-3.5 w-3.5"/> GitHub Bağla (seninki gibi)</a>
              {reposError && <p className="text-[11px] text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3"/>{reposError}</p>}
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--muted)]">{githubLogin ? `@${githubLogin}` : ""} • {repos.length} repo • sana özel</span>
                <button onClick={loadRepos} className="p-1 rounded hover:bg-[var(--surface-cream)]"><RefreshCw className="h-3 w-3 text-[var(--muted)]"/></button>
              </div>
              <div className="max-h-[220px] overflow-y-auto space-y-1 pr-1">
                {repos.slice(0,20).map((r:any)=>(
                  <button key={r.id} onClick={()=>selectRepo(r.full_name)} className={`w-full text-left rounded-[8px] px-2.5 py-2 text-xs border transition ${selectedRepo===r.full_name ? "bg-[var(--ink)] text-[var(--canvas)] border-transparent" : "bg-[var(--canvas)] border-[var(--hairline-soft)] hover:border-[var(--hairline)] text-[var(--ink)]"}`}>
                    <p className="font-medium truncate flex items-center gap-1">{r.full_name} {r.private && <span className="text-[10px] opacity-60">🔒</span>} {selectedRepo===r.full_name && <Check className="h-3 w-3 ml-auto"/>}</p>
                    {r.description && <p className="text-[11px] opacity-70 truncate">{r.description}</p>}
                    <p className="text-[10px] opacity-60">{r.language || ""} • {new Date(r.updated_at).toLocaleDateString("tr-TR")}</p>
                  </button>
                ))}
                {repos.length===0 && !reposLoading && <p className="text-xs text-[var(--muted)]">Repo yok — GitHub’da oluştur veya yenile.</p>}
              </div>
              {selectedRepo && <button onClick={async()=>{ await fetch("/api/github/selected",{method:"DELETE",credentials:"include"}); setSelectedRepo(null)}} className="w-full text-xs text-[var(--muted)] hover:text-red-600 py-1">Seçimi kaldır</button>}
              <Link href="/workspace" className="block text-xs text-center text-[var(--muted)] hover:text-[var(--ink)]">Workspace’de yönet →</Link>
            </div>
          )}
        </section>

        {/* — DRIVE seninki gibi bağlansın — */}
        <section className="rounded-[12px] border border-[var(--hairline)] bg-[var(--surface)] p-3">
          <p className="text-[10px] tracking-[0.12em] font-semibold text-[var(--muted)] flex items-center gap-2"><HardDrive className="h-3 w-3"/> DRIVE — seninki gibi</p>
          {driveLoading ? (
            <p className="text-xs text-[var(--muted)] mt-2 flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin"/> Drive kontrol ediliyor…</p>
          ) : driveOk ? (
            <div className="mt-2 space-y-1.5">
              <p className="text-xs rounded-[8px] bg-emerald-600 text-white px-2.5 py-1.5 flex items-center gap-1"><Check className="h-3 w-3"/> Bağlı: {driveRealAccount || "Drive"} — {user?.u} hesabına özel</p>
              <div className="max-h-[180px] overflow-y-auto space-y-1">
                {driveFiles.slice(0,8).map((f:any)=>(
                  <a key={f.id} href={f.webViewLink} target="_blank" className="flex items-center gap-2 rounded-[8px] bg-[var(--canvas)] border border-[var(--hairline-soft)] px-2.5 py-1.5 hover:border-[var(--hairline)]">
                    <FileText className="h-3 w-3 text-[var(--muted)] shrink-0"/>
                    <span className="text-xs truncate flex-1">{f.name}</span>
                    <ExternalLink className="h-3 w-3 text-[var(--muted)] shrink-0"/>
                  </a>
                ))}
                {driveFiles.length===0 && <p className="text-xs text-[var(--muted)]">Dosya yok — Drive klasörün boş.</p>}
              </div>
              <a href="https://drive.google.com/drive/folders/1WJxce63LuN_LO4Z85x2DXluL0PSDGues" target="_blank" className="block text-xs text-center rounded-[8px] border border-[var(--hairline)] bg-[var(--canvas)] py-1.5 hover:bg-[var(--surface-cream)] flex items-center justify-center gap-1"><Cloud className="h-3 w-3"/> Klasörü aç</a>
              <button onClick={loadDrive} className="w-full text-xs text-[var(--muted)] flex items-center justify-center gap-1 py-1 hover:text-[var(--ink)]"><RefreshCw className="h-3 w-3"/> Yenile</button>
              <p className="text-[10px] text-[var(--muted)]">{driveNote}</p>
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-[var(--muted)]">{driveNote || "Drive henüz bu hesaba bağlı değil — seninki gibi tek tıkla bağla, hep kalır."}</p>
              <a href="/api/auth/google?type=all" className="flex items-center justify-center gap-2 rounded-[8px] bg-[#4285F4] text-white px-3 py-2 text-xs font-medium hover:bg-[#357ae8]"><HardDrive className="h-3.5 w-3.5"/> Drive Bağla (seninki gibi)</a>
              <a href="/api/auth/google?type=drive" className="block text-xs text-center rounded-[8px] border border-[var(--hairline)] bg-[var(--canvas)] py-1.5 hover:bg-[var(--surface-cream)]">Sadece Drive</a>
              <button onClick={loadDrive} className="w-full text-xs text-[var(--muted)] flex items-center justify-center gap-1 py-1"><RefreshCw className="h-3 w-3"/> Tekrar dene</button>
            </div>
          )}
        </section>



        <section className="rounded-[12px] border border-[var(--hairline)] bg-[var(--surface)] p-3">
          <p className="text-xs font-semibold text-[var(--ink)]">Hızlı erişim</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Link href="/editor" className="rounded-[8px] border border-[var(--hairline)] bg-[var(--canvas)] py-2 text-xs text-center font-medium hover:bg-[var(--surface-cream)]"><FileCode className="h-3 w-3 inline mr-1"/> Editör</Link>
            <Link href="/workspace" className="rounded-[8px] border border-[var(--hairline)] bg-[var(--canvas)] py-2 text-xs text-center font-medium hover:bg-[var(--surface-cream)]"><Layers className="h-3 w-3 inline mr-1"/> Projeler</Link>
          </div>
        </section>
      </div>

      <div className="p-3 border-t border-[var(--hairline)]">
        {user && (
          <div className="flex items-center gap-3 rounded-[12px] border border-[var(--hairline)] bg-[var(--surface)] p-3">
            <div className="h-8 w-8 rounded-full bg-[var(--ink)] text-[var(--canvas)] grid place-items-center text-xs font-bold">{user.u[0]?.toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-[var(--ink)]">{user.u}</p>
              <p className="text-xs text-[var(--muted)]">{user.r}</p>
              {selectedRepo && <p className="text-[10px] text-[var(--muted)] truncate">📦 {selectedRepo}</p>}
            </div>
            <button onClick={()=>setShowProfile(true)} className="p-2 rounded-full hover:bg-[var(--surface-cream)]"><User className="h-4 w-4 text-[var(--muted)]"/></button>
          </div>
        )}
      </div>

      {showProfile && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] border border-[var(--hairline)] rounded-[16px] p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[20px]">Profil</h3>
              <button onClick={()=>setShowProfile(false)} className="p-1 hover:bg-[var(--surface-cream)] rounded"><X className="h-4 w-4"/></button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="text-xs font-medium text-[var(--muted)]">Kullanıcı adın</label>
              <Input value={newUsername} onChange={e=>setNewUsername(e.target.value)} className="bg-[var(--canvas)] border-[var(--hairline)]"/>
              <Button onClick={saveProfile} className="w-full btn-coral">Kaydet</Button>
              <p className="text-xs text-[var(--muted)]">Supabase’de saklanır, rehberde görünür.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
