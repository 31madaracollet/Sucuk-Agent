"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { MessageCircle, Users, Plus, ChevronLeft, ChevronRight, User, X, Sparkles, Search, FileCode, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useIsMobile } from "@/hooks/use-mobile"

export function Sidebar({ collapsedDefault = false }: { collapsedDefault?: boolean }) {
  const [collapsed, setCollapsed] = useState(collapsedDefault)
  const [chats, setChats] = useState<any[]>([])
  const [friends, setFriends] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [q, setQ] = useState("")
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(()=>{
    const loadUser = async () => {
      try { const r = await fetch("/api/auth/me",{credentials:"include"}); const j=await r.json(); if(j.authenticated) {setUser({u:j.user.username,r:j.user.role,id:j.user.id}); setNewUsername(j.user.username)} } catch{}
    }
    loadUser(); loadChats(); loadFriends()
    const onChatsChanged=()=>loadChats()
    window.addEventListener("sucuk:chatsChanged", onChatsChanged)
    const onVis=()=>{ if(document.visibilityState==="visible") loadChats() }
    document.addEventListener("visibilitychange",onVis)
    return()=>{ window.removeEventListener("sucuk:chatsChanged",onChatsChanged); document.removeEventListener("visibilitychange",onVis)}
  },[])

  async function loadChats(){ try{const r=await fetch("/api/chat",{credentials:"include"}); const j=await r.json(); const server=j.chats??[]; try{ const ls=localStorage.getItem("sucuk:chats"); const lsChats=ls?JSON.parse(ls):[]; const merged=[...server]; for(const lc of lsChats){ if(!merged.find((c:any)=>c.id===lc.id)) merged.push(lc)}; const final=merged.length?merged:lsChats; setChats(final); if(final.length) localStorage.setItem("sucuk:chats", JSON.stringify(final)); else if(server.length) localStorage.setItem("sucuk:chats", JSON.stringify(server)); else setChats(server)}catch{ setChats(server)} }catch{ try{ const ls=localStorage.getItem("sucuk:chats"); if(ls) setChats(JSON.parse(ls)) }catch{} } }
  async function loadFriends(){ try{const r=await fetch("/api/friends",{credentials:"include"}); const j=await r.json(); setFriends(j.friends?? j.friendships?? [])}catch{} }

  const [selectedFriend, setSelectedFriend] = useState<any>(null)
  const [friendMsgs, setFriendMsgs] = useState<any[]>([])
  const [friendInput, setFriendInput] = useState("")
  async function loadFriendChat(fid:string, obj:any){ setSelectedFriend(obj); try{const r=await fetch(`/api/messages?otherId=${fid}`,{credentials:"include"}); const j=await r.json(); setFriendMsgs(j.messages??[])}catch{} }
  async function sendFriendMsg(){ if(!friendInput.trim()||!selectedFriend) return; const fid=selectedFriend.friend?.id || selectedFriend.friendId || selectedFriend.friend_id; await fetch("/api/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({receiverId:fid,content:friendInput}),credentials:"include"}); setFriendInput(""); loadFriendChat(fid, selectedFriend) }

  async function createNewChat(){
    try{ const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:"Yeni Sohbet"}),credentials:"include"}); const data=await res.json(); if(!res.ok){alert(data.error||"Oluşturulamadı"); return} if(data.chat){ try{ const ls=localStorage.getItem("sucuk:chats"); const arr=ls?JSON.parse(ls):[]; arr.unshift(data.chat); localStorage.setItem("sucuk:chats", JSON.stringify(arr)); localStorage.setItem(`sucuk:chat:${data.chat.id}`, JSON.stringify(data.chat)); localStorage.setItem(`sucuk:msgs:${data.chat.id}`, JSON.stringify([])) }catch{}; router.push(`/chat/${data.chat.id}`) } loadChats(); window.dispatchEvent(new CustomEvent("sucuk:chatsChanged")) }catch(e:any){alert("Hata: "+e.message)}
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
                  <p className="text-[10px] tracking-[0.12em] text-[var(--muted)] font-medium">ARKADAŞLAR</p>
                  <div className="mt-2 space-y-1">
                    {friends.slice(0,8).map((f:any)=>(
                      <div key={f.id} className="flex items-center gap-2 rounded-[10px] bg-[var(--surface)] border border-[var(--hairline-soft)] px-3 py-2.5">
                        <span className="h-7 w-7 rounded-full bg-[var(--ink)] text-[var(--canvas)] grid place-items-center text-xs font-bold">{f.friend?.username?.[0]?.toUpperCase() ?? "?"}</span>
                        <span className="text-sm truncate flex-1">{f.friend?.username ?? f.friend_id}</span>
                      </div>
                    ))}
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
        <Link href="/friends" className={`p-2.5 rounded-[10px] border ${pathname==="/friends"?"bg-[var(--ink)] text-[var(--canvas)]":"bg-[var(--surface)] text-[var(--muted)] border-[var(--hairline)]"}`}><Users className="h-4 w-4"/></Link>
        <Link href="/editor" className="p-2.5 rounded-[10px] bg-[var(--surface)] border border-[var(--hairline)] text-[var(--muted)]"><FileCode className="h-4 w-4"/></Link>
        <div className="mt-auto h-8 w-8 rounded-full bg-[var(--ink)] text-[var(--canvas)] grid place-items-center text-xs font-bold">{user?.u?.[0]?.toUpperCase() ?? "?"}</div>
      </div>
    )
  }

  return (
    <div className="w-[280px] shrink-0 border-r border-[var(--hairline)] bg-[var(--canvas)] flex flex-col h-[calc(100vh-64px)] sticky top-[64px]">
      {/* Yeni Sohbet — coral primary, Claude imzası */}
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

        <section>
          <p className="text-[10px] tracking-[0.12em] font-semibold text-[var(--muted)] flex items-center gap-2"><Users className="h-3 w-3"/> REHBER</p>
          <div className="mt-2 space-y-1.5">
            {friends.length===0 ? <p className="text-xs text-[var(--muted)]">Arkadaş yok</p> : friends.map((f:any)=>(
              <button key={f.id} onClick={()=>loadFriendChat(f.friend?.id || f.friendId || f.friend_id, f)} className={`w-full flex items-center gap-2 rounded-[10px] px-3 py-2 text-left border transition ${selectedFriend?.id===f.id ? "bg-[var(--ink)] text-[var(--canvas)] border-transparent" : "bg-[var(--surface)] border-[var(--hairline-soft)] hover:bg-[var(--surface-cream)] hover:border-[var(--hairline)]"}`}>
                <span className={`h-7 w-7 rounded-full grid place-items-center text-xs font-bold shrink-0 ${selectedFriend?.id===f.id?"bg-[var(--canvas)] text-[var(--ink)]":"bg-[var(--ink)] text-[var(--canvas)]"}`}>{f.friend?.username?.[0]?.toUpperCase() ?? "?"}</span>
                <span className={`truncate flex-1 text-sm ${selectedFriend?.id===f.id?"text-[var(--canvas)]":"text-[var(--ink)]"}`}>{f.friend?.username ?? f.friend_id}</span>
              </button>
            ))}
            <Link href="/friends" className="block text-xs text-center text-[var(--muted)] hover:text-[var(--ink)] mt-1">Tüm rehber →</Link>
          </div>
          {selectedFriend && (
            <div className="mt-3 rounded-[12px] border border-[var(--hairline)] bg-[var(--surface)] p-3">
              <p className="text-xs font-medium text-[var(--ink)]">💬 {selectedFriend.friend?.username ?? "Arkadaş"} — hızlı DM</p>
              <div className="max-h-[160px] overflow-y-auto space-y-1 mt-2">
                {friendMsgs.length===0 ? <p className="text-xs text-[var(--muted)]">Mesaj yok</p> : friendMsgs.slice(-8).map((m:any)=>(
                  <div key={m.id} className={`text-xs p-2 rounded-[10px] ${m.receiverId===selectedFriend.friend?.id || m.receiverId===selectedFriend.friendId ? "bg-[var(--ink)] text-[var(--canvas)] ml-6" : "bg-[var(--canvas-soft)] text-[var(--ink-soft)] mr-6 border border-[var(--hairline-soft)]"}`}>{m.content}</div>
                ))}
              </div>
              <div className="flex gap-1.5 mt-2">
                <input value={friendInput} onChange={e=>setFriendInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendFriendMsg()} placeholder="Mesaj..." className="flex-1 rounded-full border border-[var(--hairline)] bg-[var(--canvas)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--coral)]"/>
                <button onClick={sendFriendMsg} className="rounded-full bg-[var(--ink)] text-[var(--canvas)] px-3 py-1.5 text-xs font-medium">Gönder</button>
              </div>
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
