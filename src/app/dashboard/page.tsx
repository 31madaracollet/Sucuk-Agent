"use client"
import { useEffect, useState } from "react"
import { Plus, MessageCircle, Trash2, Sparkles, HardDrive, ArrowRight, Search, Clock, Layers, FileCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"

export default function DashboardPage() {
  const [chats, setChats] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState("")
  const [q, setQ] = useState("")

  function chatsKey(uid:string){ return `sucuk:chats:${uid}` }
  function chatKey(uid:string,cid:string){ return `sucuk:chat:${uid}:${cid}` }
  function msgsKey(uid:string,cid:string){ return `sucuk:msgs:${uid}:${cid}` }
  function deletedKey(uid:string){ return `sucuk:deleted:${uid}` }

  async function getUid():Promise<string|null>{
    try{ const r=await fetch("/api/auth/me",{credentials:"include"}); const j=await r.json(); if(j.authenticated) return j.user.id }catch{}
    return null
  }

  async function load(){
    try{
      const [cRes, aRes]=await Promise.all([
        fetch("/api/chat",{credentials:"include"}),
        fetch("/api/announcements",{credentials:"include"}),
      ])
      const cData=await cRes.json().catch(()=>({chats:[]})); const aData=await aRes.json().catch(()=>({announcements:[]}))
      const serverChats=cData.chats??[]
      const uid=await getUid()
      if(!uid){
        setChats(serverChats); setAnnouncements(aData.announcements??[]); setLoading(false); return
      }
      // eski global temizliği
      try{
        localStorage.removeItem("sucuk:chats")
        for(let i=localStorage.length-1;i>=0;i--){
          const k=localStorage.key(i); if(!k) continue
          const parts=k.split(":")
          if(k.startsWith("sucuk:chat:") && parts.length===3) localStorage.removeItem(k)
          if(k.startsWith("sucuk:msgs:") && parts.length===3) localStorage.removeItem(k)
        }
      }catch{}
      try{
        const perKey=chatsKey(uid); const dKey=deletedKey(uid)
        const raw=localStorage.getItem(perKey); let lsChats=raw?JSON.parse(raw):[]
        const delRaw=localStorage.getItem(dKey); const deletedIds=delRaw?JSON.parse(delRaw):[]
        lsChats=lsChats.filter((c:any)=> !deletedIds.includes(c.id))
        const merged=[...serverChats]
        for(const lc of lsChats){ if(!merged.find((c:any)=>c.id===lc.id)) merged.push(lc) }
        const finalMerged=merged.filter((c:any)=> !deletedIds.includes(c.id))
        const final=finalMerged.length?finalMerged:serverChats
        setChats(final)
        try{
          localStorage.setItem(perKey, JSON.stringify(final))
          for(const c of final){ try{ localStorage.setItem(chatKey(uid,c.id), JSON.stringify(c)) }catch{} }
        }catch{}
        // Vercel ephemeral kayıp: server sıfır ama local doluysa, eksikleri restore et (aynı id ile)
        try{
          const missing = finalMerged.filter((c:any)=> !serverChats.find((s:any)=>s.id===c.id))
          for(const m of missing.slice(0,8)){
            await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:m.title, restoreId:m.id}),credentials:"include"}).catch(()=>{})
            // mesajları da geri yükle
            try{
              const msgsRaw=localStorage.getItem(msgsKey(uid,m.id)); const msgs=msgsRaw?JSON.parse(msgsRaw):[]
              for(const msg of msgs.slice(0,50)){
                if(msg.sender==="user" && msg.content) await fetch(`/api/chat/${m.id}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:msg.content}),credentials:"include"}).catch(()=>{})
              }
            }catch{}
          }
        }catch{}
      }catch{ setChats(serverChats) }
      setAnnouncements(aData.announcements??[]); setLoading(false)
    }catch{
      try{
        const uid=await getUid()
        if(uid){
          const ls=localStorage.getItem(chatsKey(uid))
          if(ls) setChats(JSON.parse(ls))
        }
      }catch{}
      setLoading(false)
    }
  }

  async function createChat(){
    try{
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:newTitle||"Yeni Sohbet"}),credentials:"include"})
      const data=await res.json()
      if(!res.ok){ alert(data.error||"Oluşturulamadı"); return }
      const uid=await getUid()
      const newChats=[data.chat,...chats]; setChats(newChats)
      try{
        if(uid){
          localStorage.setItem(chatsKey(uid), JSON.stringify(newChats))
          localStorage.setItem(chatKey(uid,data.chat.id), JSON.stringify(data.chat))
          localStorage.setItem(msgsKey(uid,data.chat.id), JSON.stringify([]))
          // tombstone'dan çıkar
          try{ const dKey=deletedKey(uid); const raw=localStorage.getItem(dKey); if(raw){ let del=JSON.parse(raw); del=del.filter((x:string)=>x!==data.chat.id); localStorage.setItem(dKey, JSON.stringify(del)) } }catch{}
        }
      }catch{}
      setNewTitle("")
      window.dispatchEvent(new CustomEvent("sucuk:chatsChanged"))
      window.location.href=`/chat/${data.chat.id}`
    }catch(e:any){ alert("Hata: "+e.message)}
  }

  async function deleteChat(id:string){
    if(!confirm("Sohbet silinsin mi? Drive yedeğinden de silinecek — tamamen silinecek.")) return
    const r=await fetch(`/api/chat/${id}`,{method:"DELETE",credentials:"include"})
    if(!r.ok){ alert("Silinemedi"); return }
    const remaining=chats.filter(c=>c.id!==id); setChats(remaining)
    try{
      const uid=await getUid()
      if(uid){
        localStorage.setItem(chatsKey(uid), JSON.stringify(remaining))
        localStorage.removeItem(chatKey(uid,id))
        localStorage.removeItem(msgsKey(uid,id))
        // tombstone ekle — bir daha geri gelmesin
        const dKey=deletedKey(uid); const raw=localStorage.getItem(dKey); let del=raw?JSON.parse(raw):[]; if(!del.includes(id)) del.push(id); localStorage.setItem(dKey, JSON.stringify(del))
        // eski genericleri de sil
        localStorage.removeItem(`sucuk:chat:${id}`)
        localStorage.removeItem(`sucuk:msgs:${id}`)
        localStorage.removeItem("sucuk:chats")
      }
    }catch{}
    window.dispatchEvent(new CustomEvent("sucuk:chatsChanged",{detail:{deleted:id}}))
    try{
      const rc=await fetch("/api/chat",{credentials:"include"}); const j=await rc.json()
      if(j.chats) {
        setChats(j.chats??[])
        try{
          const uid2=await getUid()
          if(uid2) localStorage.setItem(chatsKey(uid2), JSON.stringify(j.chats??[]))
        }catch{}
      }
    }catch{}
  }

  async function exportAll(){
    const data=await Promise.all(chats.map(async c=>{ const r=await fetch(`/api/chat/${c.id}`,{credentials:"include"}); const j=await r.json(); return {chat:j.chat,messages:j.messages}}))
    const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),chats:data},null,2)],{type:"application/json"})
    const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`sucuk-yedek-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url)
  }

  useEffect(()=>{ load() },[])

  const filtered = chats.filter(c=> !q || c.title.toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <Navbar/>
      <div className="flex">
        <Sidebar/>
        <div className="flex-1 min-w-0 bg-[var(--canvas)]">
          <div className="mx-auto max-w-[980px] px-6 md:px-8 py-8 space-y-6">
            {/* Header — editorial */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-[32px] tracking-[-0.8px] leading-none flex items-center gap-3"><Sparkles className="h-6 w-6 text-[var(--coral)]"/> Sohbetler</h1>
                <p className="text-sm text-[var(--muted)] mt-2">Parchment gündüz, cihaz gece. Supabase kalıcı • Drive oto-yedek • Artifact sağda</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="rounded-full border-[var(--hairline)] bg-[var(--surface)] hover:bg-[var(--surface-cream)]" onClick={exportAll}><HardDrive className="h-4 w-4"/> Yedek indir</Button>
                <Button onClick={()=>document.getElementById("new-chat-input")?.focus()} className="btn-coral"><Plus className="h-4 w-4"/> Yeni sohbet</Button>
              </div>
            </div>

            {/* Search + create */}
            <div className="card-claude p-2 flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]"/>
                <Input id="new-chat-input" placeholder="Yeni sohbet başlığı — örn. Köpek çiz, Python dersi" value={newTitle} onChange={e=>setNewTitle(e.target.value)} onKeyDown={e=>e.key==="Enter"&&createChat()} className="pl-9 bg-[var(--canvas)] border-[var(--hairline)] placeholder:text-[var(--muted)]"/>
              </div>
              <Button onClick={createChat} className="btn-coral shrink-0">Oluştur <ArrowRight className="ml-1 h-4 w-4"/></Button>
            </div>

            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <div className="flex-1 relative max-w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"/>
                <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Sohbetlerde ara…" className="w-full rounded-full border border-[var(--hairline)] bg-[var(--surface)] pl-9 pr-3 py-2 text-sm placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--coral)]"/>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1"><Clock className="h-3 w-3"/> {chats.length} sohbet • 1 hafta kullanılmayan temizlenir (admin hariç)</span>
            </div>

            {announcements.length>0 && (
              <div className="card-claude p-4">
                <p className="text-[10px] tracking-[0.12em] font-semibold text-[var(--muted)]">DUYURULAR</p>
                <div className="mt-2 grid gap-2">
                  {announcements.slice(0,3).map((a:any)=>(
                    <div key={a.id} className="rounded-[12px] border border-[var(--hairline-soft)] bg-[var(--canvas-soft)] p-3">
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-[var(--muted)] mt-1">{a.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card-claude p-2">
              {loading ? <p className="px-3 py-8 text-sm text-[var(--muted)]">Yükleniyor…</p> : filtered.length===0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto h-12 w-12 rounded-[14px] bg-[var(--canvas-soft)] border border-[var(--hairline)] grid place-items-center mb-3"><MessageCircle className="h-6 w-6 text-[var(--muted)]"/></div>
                  <p className="text-sm text-[var(--muted)]">Henüz sohbet yok. Başlık yaz ve oluştur — artifact sağda açılacak.</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {filtered.map(chat=>(
                    <div key={chat.id} onClick={()=>window.location.href=`/chat/${chat.id}`} className="group flex items-center justify-between gap-3 rounded-[12px] border border-[var(--hairline-soft)] bg-[var(--surface)] p-4 hover:border-[var(--hairline)] hover:bg-[var(--surface-cream)] cursor-pointer transition">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="h-9 w-9 rounded-[10px] bg-[var(--ink)] text-[var(--canvas)] grid place-items-center shrink-0"><MessageCircle className="h-4 w-4"/></span>
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-medium">{chat.title}</p>
                          <p className="text-xs text-[var(--muted)] flex items-center gap-2"><Clock className="h-3 w-3"/>{new Date(chat.updatedAt).toLocaleString("tr-TR")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden sm:inline text-xs text-[var(--muted)] group-hover:text-[var(--ink)]">Aç →</span>
                        <Button size="sm" variant="outline" className="opacity-60 group-hover:opacity-100 rounded-full border-[var(--hairline)] hover:bg-[var(--ink)] hover:text-[var(--canvas)]" onClick={e=>{e.stopPropagation(); deleteChat(chat.id)}}><Trash2 className="h-3.5 w-3.5"/></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="card-claude p-5">
                <Layers className="h-5 w-5 text-[var(--coral)] mb-2"/>
                <p className="text-sm font-medium">Artifact split</p>
                <p className="text-xs text-[var(--muted)] mt-1">Sohbet sol, eser sağ. Kod/görsel canlı preview — Claude Haziran 2024 imzası.</p>
              </div>
              <div className="card-claude p-5">
                <FileCode className="h-5 w-5 text-[var(--coral)] mb-2"/>
                <p className="text-sm font-medium">Kod + Drive</p>
                <p className="text-xs text-[var(--muted)] mt-1">Supabase kalıcı, Drive oto-yedek, 1 hafta kuralı (admin hariç).</p>
              </div>
              <div className="card-claude p-5">
                <Sparkles className="h-5 w-5 text-[var(--coral)] mb-2"/>
                <p className="text-sm font-medium">Orchestrator</p>
                <p className="text-xs text-[var(--muted)] mt-1">Groq 120B, FLUX.1, Reasoner — kota bitince yedeğe sessizce geçer.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
