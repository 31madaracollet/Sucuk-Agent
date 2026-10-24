"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { MessageCircle, Users, Plus, ChevronLeft, ChevronRight, User, Settings, LogOut, HardDrive, Bot, X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Sidebar({ collapsedDefault = false }: { collapsedDefault?: boolean }) {
  const [collapsed, setCollapsed] = useState(collapsedDefault)
  const [chats, setChats] = useState<any[]>([])
  const [friends, setFriends] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const pathname = usePathname()
  const router = useRouter()

  useEffect(()=>{
    try{
      const m = document.cookie.match(/sucuk_session=([^;]+)/)
      if(m){
        const payload = JSON.parse(atob(m[1].split(".")[0].replace(/-/g,"+").replace(/_/g,"/")))
        setUser(payload)
        setNewUsername(payload.u)
      }
    }catch{}
    loadChats()
    loadFriends()
  },[])

  async function loadChats(){
    try{
      const r = await fetch("/api/chat", { credentials:"include" })
      const j = await r.json()
      setChats(j.chats ?? [])
    }catch{}
  }
  async function loadFriends(){
    try{
      const r = await fetch("/api/friends", { credentials:"include" })
      const j = await r.json()
      setFriends(j.friends ?? [])
    }catch{}
  }

  async function createNewChat(){
    const res = await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ title:"Yeni Sohbet" }), credentials:"include"})
    const data = await res.json()
    if(data.chat) router.push(`/chat/${data.chat.id}`)
    loadChats()
  }

  async function saveProfile(){
    if(!newUsername.trim()) return
    const r = await fetch("/api/profile", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ username:newUsername }), credentials:"include"})
    if(r.ok){ alert("Profil güncellendi"); setShowProfile(false); location.reload() }
    else alert("Güncellenemedi")
  }

  if(collapsed) {
    return (
      <div className="w-16 shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col items-center py-4 gap-3">
        <button onClick={()=>setCollapsed(false)} className="p-2 rounded-xl bg-white text-black"><ChevronRight className="h-4 w-4"/></button>
        <button onClick={createNewChat} className="p-2 rounded-xl bg-zinc-900 text-white hover:bg-white hover:text-black"><Plus className="h-4 w-4"/></button>
        <Link href="/dashboard" className={`p-2 rounded-xl ${pathname.startsWith("/dashboard")||pathname.startsWith("/chat")?"bg-white text-black":"bg-zinc-900 text-zinc-400"}`}><MessageCircle className="h-4 w-4"/></Link>
        <Link href="/friends" className={`p-2 rounded-xl ${pathname==="/friends"?"bg-white text-black":"bg-zinc-900 text-zinc-400"}`}><Users className="h-4 w-4"/></Link>
        <Link href="/editor" className="p-2 rounded-xl bg-zinc-900 text-zinc-400"><Bot className="h-4 w-4"/></Link>
        <Link href="/settings" className="p-2 rounded-xl bg-zinc-900 text-zinc-400"><Settings className="h-4 w-4"/></Link>
        <div className="mt-auto flex flex-col gap-2">
          <div className="h-8 w-8 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold">{user?.u?.[0] ?? "?"}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-[300px] shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col h-[calc(100vh-56px)] sticky top-[56px]">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <button onClick={createNewChat} className="flex-1 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200">
          <Plus className="h-4 w-4"/> Yeni Sohbet
        </button>
        <button onClick={()=>setCollapsed(true)} className="ml-2 p-2 rounded-full hover:bg-zinc-900"><ChevronLeft className="h-4 w-4"/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div>
          <p className="text-xs tracking-widest text-zinc-500 flex items-center gap-2"><MessageCircle className="h-3 w-3"/> SOHBET GEÇMİŞİ</p>
          <div className="mt-2 space-y-1">
            {chats.length===0 ? <p className="text-xs text-zinc-600">Henüz sohbet yok — otomatik yeni sohbet başlatılacak</p> : chats.slice(0,20).map((c:any)=>(
              <Link key={c.id} href={`/chat/${c.id}`} className={`block rounded-xl px-3 py-2 text-sm truncate ${pathname===`/chat/${c.id}` ? "bg-white text-black":"bg-zinc-900 text-zinc-300 hover:bg-zinc-800"}`}>
                {c.title}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs tracking-widest text-zinc-500 flex items-center gap-2"><Users className="h-3 w-3"/> REHBER / ARKADAŞLAR</p>
          <div className="mt-2 space-y-1">
            {friends.length===0 ? <p className="text-xs text-zinc-600">Arkadaş yok — arkadaş ekle</p> : friends.map((f:any)=>(
              <div key={f.id} className="flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
                <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs">{f.friend?.username?.[0] ?? "?"}</div>
                <span className="truncate">{f.friend?.username ?? f.friend_id}</span>
                <Link href={`/friends?dm=${f.friend_id}`} className="ml-auto text-xs bg-white text-black px-2 py-1 rounded-full">DM</Link>
              </div>
            ))}
            <Link href="/friends" className="block text-xs text-center text-zinc-500 hover:text-white mt-1">Tüm arkadaşlar →</Link>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
          <p className="text-xs text-zinc-400">Hızlı erişim</p>
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            <Link href="/friends" className="rounded-lg bg-zinc-950 border border-zinc-800 p-2 text-center hover:bg-white hover:text-black">DM Kutusu</Link>
            <Link href="/editor" className="rounded-lg bg-zinc-950 border border-zinc-800 p-2 text-center hover:bg-white hover:text-black">Kod Editörü</Link>
            <Link href="/workspace" className="rounded-lg bg-zinc-950 border border-zinc-800 p-2 text-center hover:bg-white hover:text-black">Projeler</Link>
            <button onClick={async()=>{const r=await fetch("/api/drive",{credentials:"include"});const j=await r.json(); alert(`Drive yedek: ${j.backup?.length ?? 0} sohbet` )}} className="rounded-lg bg-zinc-950 border border-zinc-800 p-2 text-center hover:bg-white hover:text-black">Drive Yedek</button>
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-zinc-800">
        {user && (
          <div className="flex items-center gap-3 rounded-xl bg-zinc-900 p-3">
            <div className="h-9 w-9 rounded-full bg-white text-black flex items-center justify-center font-bold">{user.u[0]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.u}</p>
              <p className="text-xs text-zinc-500">{user.r}</p>
            </div>
            <button onClick={()=>setShowProfile(true)} className="p-2 rounded-full hover:bg-zinc-800"><User className="h-4 w-4"/></button>
          </div>
        )}
      </div>

      {showProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Profil Düzenle</h3>
              <button onClick={()=>setShowProfile(false)} className="p-1 hover:bg-zinc-800 rounded"><X className="h-4 w-4"/></button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-zinc-400">Kullanıcı Adı</label>
                <Input value={newUsername} onChange={e=>setNewUsername(e.target.value)} className="bg-zinc-950 border-zinc-800 text-white"/>
              </div>
              <div className="flex gap-2">
                <Button onClick={saveProfile} className="flex-1 bg-white text-black">Kaydet</Button>
                <Button variant="outline" onClick={()=>setShowProfile(false)}>Kapat</Button>
              </div>
              <p className="text-xs text-zinc-500">Profil Supabase'de saklanır, yan panelde görünür.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
