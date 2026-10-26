"use client"
import { useEffect, useState, useRef } from "react"
import { Users, UserPlus, MessageCircle, Bell, HardDrive, Send, Check, Image as ImageIcon, Mic, Paperclip, Sparkles, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"

type Tab = "friends" | "notifs" | "projects" | "drive"
export default function FriendsPage(){
  const [tab,setTab]=useState<Tab>("friends")
  const [friendships,setFriendships]=useState<any[]>([])
  const [dms,setDms]=useState<any[]>([])
  const [otherId,setOtherId]=useState("")
  const [otherName,setOtherName]=useState("")
  const [newMessage,setNewMessage]=useState("")
  const [addId,setAddId]=useState("")
  const [notifications,setNotifications]=useState<any[]>([])
  const [projects,setProjects]=useState<any[]>([])
  const [projName,setProjName]=useState("")
  const [projDesc,setProjDesc]=useState("")
  const [projInvites,setProjInvites]=useState("")
  const [inviteUser,setInviteUser]=useState("")
  const [inviteProjectId,setInviteProjectId]=useState("")
  const [loading,setLoading]=useState(true)
  const fileInputRef=useRef<HTMLInputElement|null>(null)
  const [recording,setRecording]=useState(false)
  const [sttRecording,setSttRecording]=useState(false)
  const mediaRecorderRef=useRef<MediaRecorder|null>(null)

  function lsKey(k:string){ return `sucuk:${k}` }
  async function getUidLS():Promise<string|null>{ try{ const r=await fetch("/api/auth/me",{credentials:"include"}); const j=await r.json(); if(j.authenticated) return j.user.id }catch{} return null }
  async function loadFriends(){
    try{
      const fRes=await fetch("/api/friends",{credentials:"include"}); const fData=await fRes.json(); let arr=fData.friendships?? fData.friends?? []
      const uid=await getUidLS()
      if(uid){
        try{
          if(arr.length) localStorage.setItem(lsKey(`friends:${uid}`), JSON.stringify(arr))
          else { const cached=localStorage.getItem(lsKey(`friends:${uid}`)); if(cached) arr=JSON.parse(cached) }
        }catch{}
      }
      setFriendships(arr)
    }catch{}
    if(otherId){
      try{
        const mRes=await fetch(`/api/messages?otherId=${otherId}`,{credentials:"include"}); const mData=await mRes.json(); let marr=mData.messages??[]
        const uid=await getUidLS()
        if(uid){
          const dk=lsKey(`dm:${uid}:${otherId}`)
          try{
            const cachedRaw = localStorage.getItem(dk)
            const cached: any[] = cachedRaw ? JSON.parse(cachedRaw) : []
            // Birleştir — sunucu eksikse yereli ezme, eski mesajlar kalsın
            if(marr.length === 0 && cached.length > 0){
              marr = cached
            } else if(marr.length > 0 && cached.length > 0){
              // iki tarafı birleştir, id'ye göre dedupe, zaman sıralı
              const map = new Map<string, any>()
              for(const m of [...cached, ...marr]) map.set(m.id, m)
              // tmp id'li mesajlar sunucuda gerçek id ile geldiyse içerik + zamanla dedupe
              const byContent = new Map<string, any>()
              for(const m of Array.from(map.values())){
                const key = `${m.senderId}|${m.content}|${m.createdAt?.slice(0,16)}`
                if(!byContent.has(key)) byContent.set(key, m)
                else {
                  // sunucudaki gerçek id'yi tut, tmp'yi at
                  const prev = byContent.get(key)
                  if(prev.id?.startsWith("tmp-") && !m.id?.startsWith("tmp-")) byContent.set(key, m)
                }
              }
              marr = Array.from(byContent.values()).sort((a,b)=> new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            }
            // Sunucu gerideyse (+ öbür taraf yeni yazdıysa) eksik yereli sunucuya sessizce geri yükle (token yakmaz)
            if(cached.length > marr.length || cached.some((c:any)=> !marr.find((s:any)=> s.id===c.id && !c.id.startsWith("tmp-")))){
              // sadece sunucuda olmayanları dene
              const missing = cached.filter((c:any)=> !marr.some((s:any)=> s.id===c.id))
              if(missing.length && missing.length < 20){
                for(const mm of missing.slice(0,10)){
                  // tmp id'ler sunucuya gerçek id ile gidecek, içerik aynı
                  await fetch("/api/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({receiverId: mm.receiverId || otherId, content: mm.content}),credentials:"include"}).catch(()=>{})
                }
              }
            }
            localStorage.setItem(dk, JSON.stringify(marr))
            // öbür tarafın perspektifine de yaz (karşı taraf yenileyince görsün)
            try{
              const dk2 = lsKey(`dm:${otherId}:${uid}`)
              const cached2Raw = localStorage.getItem(dk2)
              const cached2: any[] = cached2Raw ? JSON.parse(cached2Raw) : []
              const map2 = new Map<string, any>()
              for(const m of [...cached2, ...marr]) map2.set(m.id, m)
              localStorage.setItem(dk2, JSON.stringify(Array.from(map2.values())))
            }catch{}
          }catch{}
        }
        setDms(marr)
      }catch{}
    }
  }
  async function loadNotifs(){ try{ const r=await fetch("/api/notifications",{credentials:"include"}); const j=await r.json(); setNotifications(j.notifications??[]) }catch{} }
  async function loadProjects(){
    try{
      const r=await fetch("/api/projects",{credentials:"include"}); const j=await r.json(); let arr=j.projects??[]
      const uid=await getUidLS()
      if(uid){
        try{
          if(arr.length) localStorage.setItem(lsKey(`projects:${uid}`), JSON.stringify(arr))
          else { const cached=localStorage.getItem(lsKey(`projects:${uid}`)); if(cached) arr=JSON.parse(cached) }
        }catch{}
      }
      setProjects(arr)
    }catch{}
  }
  async function loadAll(){ await Promise.all([loadFriends(),loadNotifs(),loadProjects()]); setLoading(false) }
  useEffect(()=>{loadAll()},[])
  useEffect(()=>{ if(otherId) loadFriends()},[otherId])
  useEffect(()=>{ const p=new URLSearchParams(window.location.search); const dm=p.get("dm"); if(dm) setOtherId(dm)},[])

  async function addFriend(){ if(!addId.trim()) return; const r=await fetch("/api/friends",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({friendId:addId.trim(), friendUsername:addId.trim()}),credentials:"include"}); const j=await r.json(); if(!r.ok) alert(j.error||"Eklenemedi"); else { setAddId(""); loadFriends(); loadNotifs(); } }
  async function sendMessage(){
    if(!newMessage.trim()||!otherId) return
    const contentToSend=newMessage
    try{ await fetch("/api/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({receiverId:otherId,content:contentToSend}),credentials:"include"}) }catch{}
    // local fallback — iki taraf da görsün, server ephemeral olsa bile
    try{
      const uid=await getUidLS()
      if(uid){
        const mine={ id:`tmp-${Date.now()}`, senderId:uid, receiverId:otherId, content:contentToSend, createdAt:new Date().toISOString(), read:false, mediaUrl:null, mediaType:null }
        setDms(prev=>[...prev, mine])
        try{
          const dk=lsKey(`dm:${uid}:${otherId}`); const cur=JSON.parse(localStorage.getItem(dk)||"[]"); cur.push(mine); localStorage.setItem(dk, JSON.stringify(cur))
          const dk2=lsKey(`dm:${otherId}:${uid}`); const cur2=JSON.parse(localStorage.getItem(dk2)||"[]"); cur2.push(mine); localStorage.setItem(dk2, JSON.stringify(cur2))
        }catch{}
      }
    }catch{}
    setNewMessage(""); loadFriends()
  }
  async function sendMedia(file:File){ if(!otherId) return
    // hızlı önizleme — hemen göster, sonra sunucuya gönder
    const previewMime = file.type || ""
    const previewKind = previewMime.startsWith("image/") ? "image" : previewMime.startsWith("video/") ? "video" : previewMime.startsWith("audio/") ? "audio" : (/\.(jpg|jpeg|png|webp|gif)$/i.test(file.name) ? "image" : /\.(mp4|webm|mov)$/i.test(file.name) ? "video" : /\.(mp3|wav|ogg|webm|m4a)$/i.test(file.name) ? "audio" : null)
    let previewUrl: string | null = null
    try{ previewUrl = await new Promise<string>((res,rej)=>{ const r=new FileReader(); r.onload=()=> res(r.result as string); r.onerror=rej; r.readAsDataURL(file) }) }catch{}
    // optimistic ekle
    try{
      const uid=await getUidLS()
      if(uid && previewUrl){
        const optimistic:any = { id:`tmp-${Date.now()}`, senderId:uid, receiverId:otherId, content: newMessage || file.name, createdAt:new Date().toISOString(), mediaUrl: previewUrl, mediaType: previewKind, media_url: previewUrl, media_type: previewKind }
        setDms(prev=> [...prev, optimistic])
        const dk=lsKey(`dm:${uid}:${otherId}`); const cur=JSON.parse(localStorage.getItem(dk)||"[]"); cur.push(optimistic); localStorage.setItem(dk, JSON.stringify(cur))
      }
    }catch{}
    const fd=new FormData(); fd.append("file",file); fd.append("receiverId",otherId); fd.append("content",newMessage)
    const res=await fetch("/api/media/upload",{method:"POST",body:fd,credentials:"include"})
    if(res.ok){
      const j=await res.json().catch(()=>null)
      const saved = j?.message
      if(saved){
        // tmp'yi gerçekle değiştir
        setDms(prev=> prev.map((x:any)=> x.id?.startsWith("tmp-") && x.content===(newMessage||file.name) ? saved : x))
        try{
          const uid=await getUidLS(); if(uid){ const dk=lsKey(`dm:${uid}:${otherId}`); const cur=JSON.parse(localStorage.getItem(dk)||"[]"); const idx=cur.findIndex((x:any)=> x.id?.startsWith("tmp-") && x.content===(newMessage||file.name)); if(idx>=0){ cur[idx]=saved; localStorage.setItem(dk, JSON.stringify(cur)) } }
        }catch{}
      }
      setNewMessage(""); loadFriends()
    } else alert("Medya gönderilemedi")
  }

  const startRecording=async()=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true}); const mr=new MediaRecorder(stream); const chunks:BlobPart[]=[]
      mr.ondataavailable=e=>chunks.push(e.data); mr.onstop=async()=>{ const blob=new Blob(chunks,{type:"audio/webm"}); const file=new File([blob],`ses-${Date.now()}.webm`,{type:"audio/webm"}); await sendMedia(file); stream.getTracks().forEach(t=>t.stop())}
      mediaRecorderRef.current=mr; mr.start(); setRecording(true)
    }catch{ alert("Mikrofon izni gerekli")}
  }
  const stopRecording=()=>{ mediaRecorderRef.current?.stop(); setRecording(false)}
  const startSTT=async()=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true}); const mr=new MediaRecorder(stream); const chunks:BlobPart[]=[]
      mr.ondataavailable=e=>chunks.push(e.data); mr.onstop=async()=>{
        const blob=new Blob(chunks,{type:"audio/webm"}); const fd=new FormData(); fd.append("file",blob,"ses.webm")
        try{ const r=await fetch("/api/stt",{method:"POST",body:fd,credentials:"include"}); const j=await r.json(); if(j.ok&&j.text) setNewMessage(p=>p+(p?" ":"")+j.text); else alert("STT hata: "+(j.error||""))}catch(e:any){alert("STT hata: "+e.message)}
        setSttRecording(false); stream.getTracks().forEach(t=>t.stop())
      }
      mediaRecorderRef.current=mr; mr.start(); setSttRecording(true)
    }catch{ alert("Mikrofon izni gerekli")}
  }
  const stopSTT=()=>{ mediaRecorderRef.current?.stop(); setSttRecording(false)}
  async function markRead(id:string){ await fetch("/api/notifications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id}),credentials:"include"}); loadNotifs() }
  async function markAllRead(){ await fetch("/api/notifications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({all:true}),credentials:"include"}); loadNotifs() }
  async function createProject(){ if(!projName.trim()) return; const invites=projInvites.split(",").map(s=>s.trim()).filter(Boolean); const r=await fetch("/api/projects",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:projName,description:projDesc,inviteUsernames:invites}),credentials:"include"}); const j=await r.json(); if(!r.ok){alert(j.error);return} setProjName(""); setProjDesc(""); setProjInvites(""); loadProjects(); loadNotifs() }
  async function inviteToProj(){ if(!inviteProjectId||!inviteUser.trim()) return; const r=await fetch("/api/projects",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({projectId:inviteProjectId,inviteUsername:inviteUser}),credentials:"include"}); const j=await r.json(); if(!r.ok){alert(j.error);return} setInviteUser(""); setInviteProjectId(""); loadProjects(); alert("Davet gönderildi") }

  if(loading) return <div className="p-10 text-[var(--muted)]">Yükleniyor…</div>
  const accepted=friendships.filter(f=>f.status==="accepted")
  const pending=friendships.filter(f=>f.status==="pending")
  const unread=notifications.filter(n=>!n.read).length

  return (
    <>
      <Navbar/>
      <div className="flex">
        <Sidebar/>
        <div className="flex-1 min-w-0 bg-[var(--canvas)]">
          <div className="mx-auto max-w-[1100px] px-6 md:px-8 py-8 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-[28px] tracking-[-0.6px] flex items-center gap-2"><Users className="h-5 w-5 text-[var(--coral)]"/> Arkadaşlar — DM</h1>
                <p className="text-sm text-[var(--muted)] mt-1">Foto/video/ses → Drive’a yazılır, Supabase’te anlık. Yan panelde de DM var.</p>
              </div>
              <Button onClick={async()=>{const r=await fetch("/api/drive",{credentials:"include"}); const j=await r.json(); const blob=new Blob([JSON.stringify(j.backup,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`sucuk-drive-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url)}} className="rounded-full border border-[var(--hairline)] bg-[var(--surface)] hover:bg-[var(--surface-cream)]"><HardDrive className="h-4 w-4"/> Drive yedek</Button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {(["friends","notifs","projects","drive"] as Tab[]).map(t=>(
                <button key={t} onClick={()=>setTab(t)} className={`rounded-full px-4 py-2 text-sm font-medium border whitespace-nowrap transition ${tab===t ? "bg-[var(--ink)] text-[var(--canvas)] border-[var(--ink)]" : "bg-[var(--surface)] text-[var(--muted)] border-[var(--hairline)] hover:border-[var(--hairline)] hover:text-[var(--ink)]"}`}>
                  {t==="friends" && `Arkadaşlar (${accepted.length})`}
                  {t==="notifs" && `Bildirimler ${unread?`(${unread})`:""}`}
                  {t==="projects" && `Projeler (${projects.length})`}
                  {t==="drive" && "Drive Yedek"}
                </button>
              ))}
            </div>

            {tab==="friends" && (
              <>
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-2 card-claude p-5">
                    <h3 className="font-medium flex items-center gap-2"><UserPlus className="h-4 w-4 text-[var(--coral)]"/> Arkadaş ekle</h3>
                    <div className="mt-3 flex gap-2">
                      <Input placeholder="Pirensine, Sucuk9977…" value={addId} onChange={e=>setAddId(e.target.value)} className="bg-[var(--canvas)] border-[var(--hairline)]"/>
                      <Button onClick={addFriend} className="btn-coral">Ekle</Button>
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-2">Supabase üzerinden anlık — arkadaş olunca yan panelde de görünür.</p>
                  </div>
                  <div className="card-claude p-5">
                    <h3 className="font-medium flex items-center gap-2"><Bell className="h-4 w-4"/> Bekleyen</h3>
                    {pending.length===0 ? <p className="text-sm text-[var(--muted)] text-center py-6">Bekleyen yok.</p> : pending.map(f=>(
                      <div key={f.id} className="flex items-center justify-between rounded-[12px] border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3 mt-3">
                        <span className="text-sm">{f.friend?.username ?? f.otherUsername ?? f.friendId ?? f.friend_id}</span>
                        <Button size="sm" className="btn-coral h-8" onClick={async()=>{await fetch("/api/friends",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:f.id}),credentials:"include"}); loadFriends(); loadNotifs()}}><Check className="h-3 w-3"/> Onayla</Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="card-claude p-4">
                    <h3 className="font-medium flex items-center gap-2"><Users className="h-4 w-4"/> Rehber</h3>
                    <div className="mt-3 space-y-2">
                      {accepted.length===0 ? <p className="text-sm text-[var(--muted)] text-center py-6">Yok — Sucuk9977 & Pirensine varsayılan arkadaş.</p> : accepted.map(f=>{
                        const fid=f.friend?.id ?? f.otherId ?? f.friendId ?? f.friend_id
                        const name=f.friend?.username ?? f.otherUsername ?? f.friendId ?? "?"
                        return (
                          <button key={f.id} onClick={()=>{setOtherId(fid); setOtherName(name)}} className={`w-full flex items-center justify-between rounded-[12px] border p-3 text-left ${otherId===fid ? "bg-[var(--ink)] text-[var(--canvas)] border-transparent" : "bg-[var(--surface)] border-[var(--hairline)] hover:bg-[var(--surface-cream)]"}`}>
                            <span className="flex items-center gap-2 text-sm"><span className={`h-7 w-7 rounded-full grid place-items-center text-xs font-bold ${otherId===fid ? "bg-white text-black" : "bg-[var(--ink)] text-[var(--canvas)]"}`}>{name[0]?.toUpperCase()}</span>{name}</span>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${otherId===fid ? "bg-white text-black" : "bg-[var(--coral)] text-white"}`}>DM</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="lg:col-span-2 card-claude p-0 flex flex-col h-[560px] overflow-hidden">
                    {!otherId ? <div className="flex-1 grid place-items-center text-[var(--muted)] p-6 text-center"><div><MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-40"/><p>Arkadaş seç — foto/video/ses at, Drive’a yazılır.</p></div></div> : (
                      <>
                        <div className="px-4 py-3 border-b border-[var(--hairline)] flex items-center justify-between bg-[var(--canvas-soft)]">
                          <span className="font-medium flex items-center gap-2"><span className="h-7 w-7 rounded-full bg-[var(--ink)] text-[var(--canvas)] grid place-items-center text-xs">{otherName[0]?.toUpperCase()}</span>{otherName}</span>
                          <span className="text-xs text-emerald-600 flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"/> Drive’a yazılıyor</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--canvas)]">
                          {dms.length===0 ? <p className="text-center text-sm text-[var(--muted)]">Henüz mesaj yok — WhatsApp gibi at.</p> : dms.map((m:any)=>{
                            const rawUrl = m.mediaUrl || m.media_url
                            const rawType = m.mediaType || m.media_type
                            const inferByUrl = rawUrl?.startsWith("data:image") ? "image" : rawUrl?.startsWith("data:video") ? "video" : rawUrl?.startsWith("data:audio") ? "audio" : null
                            const inferByName = m.content ? (/\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(m.content) ? "image" : /\.(mp4|webm|mov|avi)$/i.test(m.content) ? "video" : /\.(mp3|wav|ogg|m4a|webm)$/i.test(m.content) ? "audio" : null) : null
                            const mt = rawType || inferByUrl || inferByName
                            const hasMedia = !!rawUrl
                            return (
                            <div key={m.id} className={`flex group ${m.senderId===otherId ? "justify-start" : "justify-end"}`}>
                              <div className={`max-w-[75%] rounded-[16px] px-3 py-2 text-sm ${m.senderId===otherId ? "bg-[var(--surface)] border border-[var(--hairline)] text-[var(--ink)]" : "bg-[var(--ink)] text-[var(--canvas)]"}`}>
                                {hasMedia && mt==="image" && <a href={rawUrl} target="_blank" rel="noopener noreferrer" className="block"><img src={rawUrl} alt={m.content || "resim"} className="max-w-[220px] rounded-[10px] mb-2 cursor-pointer hover:opacity-90" onClick={e=>{ /* mobilde direkt aç */ }} /></a>}
                                {hasMedia && mt==="video" && <video src={rawUrl} controls playsInline className="max-w-[260px] rounded-[10px] mb-2 cursor-pointer" onClick={e=> (e.target as HTMLVideoElement).paused ? (e.target as HTMLVideoElement).play() : null } />}
                                {hasMedia && mt==="audio" && <audio src={rawUrl} controls className="w-full max-w-[240px] mb-2"/>}
                                {hasMedia && !mt && <a href={rawUrl} target="_blank" rel="noopener noreferrer" className="block mb-2 text-xs underline break-all">{m.content || "Dosya"} — aç</a>}
                                {/* dosya ismi her zaman değil, sadece medya yoksa veya caption varsa */}
                                {m.content && !m.content.startsWith("data:") && (
                                  hasMedia && mt ? <p className="text-xs opacity-80">{m.content}</p> : <p>{m.content}</p>
                                )}
                                {!m.content && !hasMedia && <p>📎 Medya</p>}
                                <div className="text-[10px] opacity-60 mt-1 flex items-center gap-2">{new Date(m.createdAt).toLocaleTimeString("tr-TR")} • {mt ? `${mt} • tıkla aç` : "Supabase"} {m.senderId!==otherId && <button onClick={async()=>{ if(!confirm("Silinsin mi? Drive’dan da silinecek")) return; await fetch(`/api/messages?messageId=${m.id}`,{method:"DELETE",credentials:"include"}); loadFriends()}} className="hidden group-hover:inline text-red-400">Sil</button>}</div>
                              </div>
                            </div>
                            )
                          })}
                        </div>
                        <div className="border-t border-[var(--hairline)] p-3 bg-[var(--surface)] flex gap-2">
                          <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*" className="hidden" onChange={e=>{const f=e.target.files?.[0]; if(f) sendMedia(f)}}/>
                          <button onClick={()=>fileInputRef.current?.click()} className="h-9 w-9 grid place-items-center rounded-[10px] border border-[var(--hairline)] bg-[var(--canvas)] hover:bg-[var(--surface-cream)]"><Paperclip className="h-4 w-4"/></button>
                          <button onClick={()=>fileInputRef.current?.click()} className="h-9 w-9 grid place-items-center rounded-[10px] border border-[var(--hairline)] bg-[var(--canvas)] hover:bg-[var(--surface-cream)]"><ImageIcon className="h-4 w-4"/></button>
                          <button onClick={recording ? stopRecording : startRecording} className={`h-9 w-9 grid place-items-center rounded-[10px] border ${recording?"bg-red-600 border-red-600 text-white animate-pulse":"bg-[var(--canvas)] border-[var(--hairline)]"}`}><Mic className="h-4 w-4"/></button>
                          <button onClick={sttRecording ? stopSTT : startSTT} className={`h-9 w-9 grid place-items-center rounded-[10px] border ${sttRecording?"bg-[var(--coral)] border-[var(--coral)] text-white animate-pulse":"bg-[var(--canvas)] border-[var(--hairline)]"}`}>🎙️</button>
                          <Input value={newMessage} onChange={e=>setNewMessage(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMessage()} placeholder="Mesaj yaz… 🎙️ Groq STT" className="flex-1 bg-[var(--canvas)] border-[var(--hairline)]"/>
                          <Button onClick={sendMessage} className="btn-coral h-9 w-9 p-0"><Send className="h-4 w-4"/></Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {tab==="notifs" && (
              <div className="card-claude p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium flex items-center gap-2"><Bell className="h-4 w-4"/> Bildirimler {unread>0 && <span className="rounded-full bg-red-600 text-white px-2 py-0.5 text-xs">{unread} yeni</span>}</h3>
                  <Button size="sm" variant="outline" onClick={markAllRead} className="rounded-full border-[var(--hairline)]">Hepsini okundu yap</Button>
                </div>
                <div className="mt-4 space-y-2">
                  {notifications.length===0 ? <p className="text-sm text-[var(--muted)] text-center py-6">Bildirim yok.</p> : notifications.map(n=>(
                    <div key={n.id} className={`flex items-center justify-between rounded-[12px] border p-3 ${n.read ? "border-[var(--hairline)] bg-[var(--canvas)] opacity-70" : "border-[var(--ink)] bg-[var(--surface-cream)]"}`}>
                      <div><p className="text-sm font-medium">{n.title} <span className="text-xs text-[var(--muted)]">{n.type}</span></p><p className="text-xs text-[var(--muted)]">{n.content}</p></div>
                      {!n.read && <Button size="sm" variant="outline" onClick={()=>markRead(n.id)} className="rounded-full"><Check className="h-3 w-3"/></Button>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab==="projects" && (
              <div className="space-y-4">
                <div className="card-claude p-5">
                  <h3 className="font-medium flex items-center gap-2"><Layers className="h-4 w-4"/> Proje oluştur</h3>
                  <div className="mt-3 space-y-2">
                    <Input placeholder="Proje adı" value={projName} onChange={e=>setProjName(e.target.value)} className="bg-[var(--surface)] border-[var(--hairline)]"/>
                    <Textarea placeholder="Açıklama" value={projDesc} onChange={e=>setProjDesc(e.target.value)} rows={2} className="bg-[var(--surface)] border-[var(--hairline)]"/>
                    <Input placeholder="Davet: kullanıcı adları virgülle" value={projInvites} onChange={e=>setProjInvites(e.target.value)} className="bg-[var(--surface)] border-[var(--hairline)]"/>
                    <Button onClick={createProject} className="btn-coral">Oluştur ve davet et</Button>
                  </div>
                </div>
                <div className="card-claude p-5">
                  <h3 className="font-medium">Projelerim</h3>
                  {projects.length===0 ? <p className="text-sm text-[var(--muted)] mt-2">Henüz proje yok.</p> : projects.map(p=>(
                    <div key={p.id} className="mt-3 rounded-[12px] border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3">
                      <p className="text-sm font-medium">{p.name}</p><p className="text-xs text-[var(--muted)]">{p.description} • {new Date(p.createdAt).toLocaleString("tr-TR")}</p>
                    </div>
                  ))}
                  <div className="mt-4 flex gap-2">
                    <Input placeholder="Proje ID" value={inviteProjectId} onChange={e=>setInviteProjectId(e.target.value)} className="bg-[var(--surface)] border-[var(--hairline)]"/>
                    <Input placeholder="Davet kullanıcı adı" value={inviteUser} onChange={e=>setInviteUser(e.target.value)} className="bg-[var(--surface)] border-[var(--hairline)]"/>
                    <Button onClick={inviteToProj} className="btn-coral">Davet et</Button>
                  </div>
                </div>
              </div>
            )}

            {tab==="drive" && (
              <div className="card-claude p-6">
                <h3 className="font-medium flex items-center gap-2"><HardDrive className="h-4 w-4"/> Drive yedek — oto aktif</h3>
                <p className="text-sm text-[var(--muted)] mt-2">Tüm sohbetler + DM’ler Supabase’e anlık yazılır, medya Drive’a yüklenir.</p>
                <Button onClick={async()=>{const r=await fetch("/api/drive",{credentials:"include"}); const j=await r.json(); const blob=new Blob([JSON.stringify(j.backup,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`drive-backup-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url)}} className="mt-4 btn-coral">Tüm sohbetleri indir</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
