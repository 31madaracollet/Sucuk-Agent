"use client"

import { useEffect, useState, useRef } from "react"
import { Users, User, UserPlus, MessageCircle, Bell, FolderKanban, HardDrive, Sparkles, Send, Check, ExternalLink, Image as ImageIcon, Video, Mic, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"

type Tab = "friends" | "notifs" | "projects" | "drive"

export default function FriendsPage() {
  const [tab, setTab] = useState<Tab>("friends")
  const [friendships, setFriendships] = useState<any[]>([])
  const [dms, setDms] = useState<any[]>([])
  const [otherId, setOtherId] = useState("")
  const [otherName, setOtherName] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [addId, setAddId] = useState("")
  const [notifications, setNotifications] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [projName, setProjName] = useState("")
  const [projDesc, setProjDesc] = useState("")
  const [projInvites, setProjInvites] = useState("")
  const [inviteUser, setInviteUser] = useState("")
  const [inviteProjectId, setInviteProjectId] = useState("")
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  async function loadFriends() {
    const fRes = await fetch("/api/friends", { credentials: "include" })
    const fData = await fRes.json()
    setFriendships(fData.friendships ?? [])
    if (otherId) {
      const mRes = await fetch(`/api/messages?otherId=${otherId}`, { credentials: "include" })
      const mData = await mRes.json()
      setDms(mData.messages ?? [])
    }
  }
  async function loadNotifs() {
    const r = await fetch("/api/notifications", { credentials: "include" })
    const j = await r.json()
    setNotifications(j.notifications ?? [])
  }
  async function loadProjects() {
    const r = await fetch("/api/projects", { credentials: "include" })
    const j = await r.json()
    setProjects(j.projects ?? [])
  }
  async function loadAll() {
    await Promise.all([loadFriends(), loadNotifs(), loadProjects()])
    setLoading(false)
  }
  useEffect(() => { loadAll() }, [])
  useEffect(() => { if (otherId) loadFriends() }, [otherId])
  // adres çubuğu ?dm= parametresi
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search)
    const dm = params.get("dm")
    if(dm) setOtherId(dm)
  },[])

  async function addFriend() {
    if (!addId.trim()) return
    await fetch("/api/friends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ friendId: addId }), credentials: "include" })
    setAddId("")
    loadFriends(); loadNotifs()
  }
  async function sendMessage() {
    if (!newMessage.trim() || !otherId) return
    await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId: otherId, content: newMessage }), credentials: "include" })
    setNewMessage("")
    loadFriends()
  }
  async function sendMedia(file: File){
    if(!otherId) return
    const fd = new FormData()
    fd.append("file", file)
    fd.append("receiverId", otherId)
    fd.append("content", newMessage)
    const res = await fetch("/api/media/upload", { method:"POST", body: fd, credentials:"include" })
    if(res.ok) { setNewMessage(""); loadFriends() } else alert("Medya gönderilemedi")
  }
  const startRecording = async () => {
    try{
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true })
      const mr = new MediaRecorder(stream)
      const chunks: BlobPart[] = []
      mr.ondataavailable = e=>chunks.push(e.data)
      mr.onstop = async ()=>{
        const blob = new Blob(chunks, { type:"audio/webm" })
        const file = new File([blob], `ses-${Date.now()}.webm`, { type:"audio/webm" })
        await sendMedia(file)
        stream.getTracks().forEach(t=>t.stop())
      }
      mediaRecorderRef.current = mr
      mr.start()
      setRecording(true)
    }catch{ alert("Mikrofon izni gerekli") }
  }
  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }
  async function markRead(id: string) {
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }), credentials: "include" })
    loadNotifs()
  }
  async function markAllRead() {
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }), credentials: "include" })
    loadNotifs()
  }
  async function createProject() {
    if (!projName.trim()) return
    const invites = projInvites.split(",").map(s => s.trim()).filter(Boolean)
    const r = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: projName, description: projDesc, inviteUsernames: invites }), credentials: "include" })
    const j = await r.json()
    if (!r.ok) { alert(j.error); return }
    setProjName(""); setProjDesc(""); setProjInvites("")
    loadProjects(); loadNotifs()
  }
  async function inviteToProj() {
    if (!inviteProjectId || !inviteUser.trim()) return
    const r = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: inviteProjectId, inviteUsername: inviteUser }), credentials: "include" })
    const j = await r.json()
    if (!r.ok) { alert(j.error); return }
    setInviteUser(""); setInviteProjectId("")
    loadProjects(); alert("Davet gönderildi")
  }
  function exportDM() {
    const blob = new Blob([JSON.stringify({ with: otherId, messages: dms, at: new Date().toISOString() }, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `dm-${otherId}-${Date.now()}.json`; a.click()
    URL.revokeObjectURL(url)
  }
  async function exportAllChatsToDrive() {
    const r = await fetch("/api/drive", { credentials: "include" })
    const j = await r.json()
    const blob = new Blob([JSON.stringify(j.backup, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `sucuk-drive-yedek-${new Date().toISOString().slice(0,10)}.json`; a.click()
    URL.revokeObjectURL(url)
    alert("Drive yedek indirildi — Google Drive'a yükleyebilirsin. Oto yedek aktif: Supabase + Drive.")
  }

  if (loading) return <div className="p-10 text-zinc-500">Yükleniyor...</div>

  const accepted = friendships.filter(f => f.status === "accepted")
  const pending = friendships.filter(f => f.status === "pending")
  const unread = notifications.filter(n => !n.read).length

  return (
    <>
      <Navbar/>
      <div className="flex">
        <Sidebar/>
        <div className="flex-1 mx-auto max-w-5xl px-4 md:px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2"><Users className="h-5 w-5" /> Arkadaşlar — WhatsApp tarzı DM</h1>
          <p className="text-sm text-zinc-500">Foto/video/ses gönder, Drive'a yüklenir, Supabase'te görülür. Varsayılan hesaplar zaten arkadaş.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400"><Sparkles className="h-3 w-3" /> WhatsApp benzeri</span>
          <Button variant="outline" className="rounded-full border-zinc-800 bg-zinc-900 text-zinc-300" onClick={exportAllChatsToDrive}><HardDrive className="h-4 w-4" /> Drive Yedek</Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {(["friends","notifs","projects","drive"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-sm font-medium border transition whitespace-nowrap ${tab===t ? "bg-white text-black border-white" : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600"}`}>
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
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Arkadaş Ekle</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="örn. Pirensine, Sucuk9977" value={addId} onChange={e=>setAddId(e.target.value)} />
                  <Button onClick={addFriend} className="rounded-full bg-white text-black hover:bg-zinc-200">Ekle</Button>
                </div>
                <p className="text-xs text-zinc-500">Kesinlikle arkadaş ekleme aktif — Supabase üzerinden anlık.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Bekleyen</CardTitle></CardHeader>
              <CardContent>
                {pending.length===0 ? <p className="text-sm text-zinc-500 text-center py-4">Bekleyen yok.</p> : pending.map(f=>(
                  <div key={f.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-3 mb-2">
                    <span className="text-sm text-white">{f.friend?.username ?? f.friendId}</span>
                    <Button size="sm" className="rounded-full bg-white text-black" onClick={async()=>{ await fetch("/api/friends",{method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({id:f.id}), credentials:"include"}); loadFriends(); loadNotifs() }}><Check className="h-3 w-3" /> Onayla</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Rehber</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {accepted.length===0 ? <p className="text-sm text-zinc-500 text-center py-4">Yok — Sucuk9977 & Pirensine varsayılan olarak arkadaş (seed).</p> : accepted.map(f=>{
                  const fid = f.friend?.id ?? f.friendId ?? f.friend_id ?? f.friendId
                  const name = f.friend?.username ?? f.friendId ?? "?"
                  return (
                    <button key={f.id} onClick={()=>{setOtherId(fid); setOtherName(name)}} className={`w-full flex items-center justify-between rounded-xl border p-3 text-left ${otherId===fid ? "border-white bg-zinc-950" : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"}`}>
                      <span className="flex items-center gap-2 text-sm text-white"><User className="h-4 w-4 text-zinc-500" /> {name}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-black">DM</span>
                    </button>
                  )
                })}
              </CardContent>
            </Card>
            <Card className="lg:col-span-2 h-[560px] flex flex-col">
              {!otherId ? <CardContent className="flex h-full flex-col items-center justify-center text-zinc-500"><MessageCircle className="h-12 w-12 mb-3 opacity-50" /><p>Arkadaş seç, DM başlat — foto/video/ses atabilirsin.</p></CardContent> : (
                <>
                  <CardHeader className="pb-2 border-b border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-medium text-white"><User className="h-5 w-5 text-zinc-400" /> {otherName || otherId}</span>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="rounded-full" onClick={exportDM}><HardDrive className="h-3 w-3" /> DM Yedek</Button>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Drive'a yazılıyor</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-950">
                    {dms.length===0 ? <p className="text-center text-sm text-zinc-500">Henüz mesaj yok — WhatsApp gibi foto/video/ses at.</p> : dms.map((m:any)=>(
                      <div key={m.id} className={`flex ${m.senderId===otherId ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.senderId===otherId?"bg-zinc-900 border border-zinc-800 text-zinc-100":"bg-white text-black"}`}>
                          {m.mediaUrl && m.mediaType==="image" && <img src={m.mediaUrl} alt="media" className="max-w-[220px] rounded-xl mb-2"/>}
                          {m.mediaUrl && m.mediaType==="video" && <video src={m.mediaUrl} controls className="max-w-[220px] rounded-xl mb-2"/>}
                          {m.mediaUrl && m.mediaType==="audio" && <audio src={m.mediaUrl} controls className="w-full mb-2"/>}
                          {!m.mediaUrl && m.content?.startsWith("data:") && m.content.includes("base64") && m.content.startsWith("data:image") && <img src={m.content} alt="media" className="max-w-[220px] rounded-xl mb-2"/>}
                          <p>{m.content && !m.content.startsWith("data:") ? m.content : (!m.mediaUrl ? "📎 Medya" : "")}</p>
                          <div className="text-[10px] opacity-60 mt-1">{new Date(m.createdAt).toLocaleTimeString("tr-TR")} • {m.mediaType ? `Drive: ${m.mediaType}` : "Supabase"}</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                  <div className="flex gap-2 border-t border-zinc-800 p-3 bg-zinc-900">
                    <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*" className="hidden" onChange={e=>{const f=e.target.files?.[0]; if(f) sendMedia(f)}}/>
                    <Button size="sm" variant="outline" className="rounded-full" onClick={()=>fileInputRef.current?.click()}><Paperclip className="h-4 w-4"/></Button>
                    <Button size="sm" variant="outline" className="rounded-full" onClick={()=>fileInputRef.current?.click()}><ImageIcon className="h-4 w-4"/></Button>
                    <Button size="sm" variant={recording?"default":"outline"} className="rounded-full" onClick={recording ? stopRecording : startRecording}>{recording ? "⏹️" : <Mic className="h-4 w-4"/>}</Button>
                    <Input placeholder="Mesaj yaz..." value={newMessage} onChange={e=>setNewMessage(e.target.value)} onKeyDown={e=>e.key==="Enter" && sendMessage()} className="bg-zinc-950 border-zinc-800 text-white"/>
                    <Button onClick={sendMessage} className="rounded-full bg-white text-black"><Send className="h-4 w-4" /></Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        </>
      )}

      {tab==="notifs" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Bildirimler {unread>0 && <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">{unread} yeni</span>}</CardTitle>
            <Button size="sm" variant="outline" className="rounded-full" onClick={markAllRead}>Hepsini okundu yap</Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {notifications.length===0 ? <p className="text-sm text-zinc-500 text-center py-6">Bildirim yok.</p> : notifications.map(n=>(
              <div key={n.id} className={`flex items-center justify-between rounded-xl border p-3 ${n.read ? "border-zinc-800 bg-zinc-950 opacity-70" : "border-white bg-zinc-900"}`}>
                <div>
                  <p className="text-sm font-medium text-white">{n.title} <span className="ml-2 text-xs text-zinc-500">{n.type}</span></p>
                  <p className="text-xs text-zinc-400">{n.content}</p>
                  <p className="text-[10px] text-zinc-600">{new Date(n.createdAt).toLocaleString("tr-TR")}</p>
                </div>
                {!n.read && <Button size="sm" variant="outline" className="rounded-full" onClick={()=>markRead(n.id)}><Check className="h-3 w-3" /></Button>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tab==="projects" && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FolderKanban className="h-5 w-5" /> Proje Oluştur — arkadaşlarla ortak</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Proje adı" value={projName} onChange={e=>setProjName(e.target.value)} />
              <Textarea placeholder="Açıklama" value={projDesc} onChange={e=>setProjDesc(e.target.value)} rows={2} />
              <Input placeholder="Davet: kullanıcı adları virgülle" value={projInvites} onChange={e=>setProjInvites(e.target.value)} />
              <Button onClick={createProject} className="rounded-full bg-white text-black">Oluştur ve Davet Et</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Projelerim</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {projects.length===0 ? <p className="text-sm text-zinc-500">Henüz proje yok.</p> : projects.map(p=>(
                <div key={p.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                  <p className="text-sm font-medium text-white">{p.name}</p>
                  <p className="text-xs text-zinc-500">{p.description} • {new Date(p.createdAt).toLocaleString("tr-TR")}</p>
                </div>
              ))}
              <div className="flex gap-2 pt-2 border-t border-zinc-800 mt-3">
                <Input placeholder="Proje ID" value={inviteProjectId} onChange={e=>setInviteProjectId(e.target.value)} className="flex-1" />
                <Input placeholder="Davet: kullanıcı adı" value={inviteUser} onChange={e=>setInviteUser(e.target.value)} className="flex-1" />
                <Button onClick={inviteToProj} className="rounded-full bg-white text-black">Davet Et</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab==="drive" && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><HardDrive className="h-5 w-5" /> Drive Yedek — oto aktif</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-zinc-400">Tüm sohbetler + DM'ler Supabase'e anlık yazılır, medya Drive'a yüklenir, tüm sohbetler tek tıkla Drive'a yedeklenir.</p>
            <div className="flex gap-2">
              <Button onClick={exportAllChatsToDrive} className="rounded-full bg-white text-black">Tüm Sohbetleri İndir (JSON) + Drive</Button>
              <Button variant="outline" className="rounded-full" onClick={()=>window.open("/workspace","_blank")}><ExternalLink className="h-4 w-4" /> Workspace</Button>
            </div>
          </CardContent>
        </Card>
      )}
        </div>
      </div>
    </>
  )
}
