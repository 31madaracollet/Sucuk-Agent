"use client"

import { useEffect, useState } from "react"
import { Users, User, UserPlus, MessageCircle, Clock, HardDrive, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function FriendsPage() {
  const [friendships, setFriendships] = useState<any[]>([])
  const [dms, setDms] = useState<any[]>([])
  const [otherId, setOtherId] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [addId, setAddId] = useState("")
  const [loading, setLoading] = useState(true)

  async function load() {
    const fRes = await fetch("/api/friends", { credentials: "include" })
    const fData = await fRes.json()
    setFriendships(fData.friendships ?? [])
    if (otherId) {
      const mRes = await fetch(`/api/messages?otherId=${otherId}`, { credentials: "include" })
      const mData = await mRes.json()
      setDms(mData.messages ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [otherId])

  async function addFriend() {
    if (!addId.trim()) return
    await fetch("/api/friends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ friendId: addId }), credentials: "include" })
    setAddId("")
    load()
  }

  async function sendMessage() {
    if (!newMessage.trim() || !otherId) return
    await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId: otherId, content: newMessage }), credentials: "include" })
    setNewMessage("")
    load()
  }

  function exportDM() {
    const blob = new Blob([JSON.stringify({ with: otherId, messages: dms, at: new Date().toISOString() }, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `dm-${otherId}-${Date.now()}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="p-10 text-zinc-500">Yükleniyor...</div>

  const accepted = friendships.filter((f) => f.status === "accepted")
  const pending = friendships.filter((f) => f.status === "pending")

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2"><Users className="h-5 w-5" /> Arkadaşlar & DM</h1>
          <p className="text-sm text-zinc-500">Kullanıcılar birlikte Agent kullanır, DM'den konuşur, Supabase saklar, Drive yedekler.</p>
        </div>
        <span className="hidden sm:flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400"><Sparkles className="h-3 w-3" /> Ortak Agent</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-zinc-800 bg-zinc-900 text-zinc-100">
          <CardHeader><CardTitle className="flex items-center gap-2 text-white"><UserPlus className="h-5 w-5" /> Arkadaş Ekle</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Kullanıcı adı (örn. Pirensine, yeni eklediğin kişi)" value={addId} onChange={(e) => setAddId(e.target.value)} className="bg-zinc-950 border-zinc-800 text-white" />
              <Button onClick={addFriend} className="rounded-full bg-white text-black hover:bg-zinc-200">Ekle</Button>
            </div>
            <p className="text-xs text-zinc-500">Adminin eklediği tüm kullanıcılar burada arkadaş olarak eklenebilir. Onaylayınca DM açılır.</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
          <CardHeader><CardTitle className="flex items-center gap-2 text-white"><Clock className="h-5 w-5" /> Bekleyen</CardTitle></CardHeader>
          <CardContent>
            {pending.length === 0 ? <p className="text-sm text-zinc-500 text-center py-4">Bekleyen yok.</p> : pending.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-2">
                <span className="text-sm text-white">{f.friendId}</span>
                <Button size="sm" className="rounded-full bg-white text-black" onClick={async () => { await fetch("/api/friends", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: f.id, status: "accepted" }), credentials: "include" }); load() }}>Onayla</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
          <CardHeader><CardTitle className="flex items-center gap-2 text-white"><Users className="h-5 w-5" /> Arkadaşlar</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {accepted.length === 0 ? <p className="text-sm text-zinc-500 text-center py-4">Henüz yok.</p> : accepted.map((f) => (
              <button key={f.id} onClick={() => setOtherId(f.friendId || f.userId)} className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition ${otherId === (f.friendId || f.userId) ? "border-white bg-zinc-950" : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"}`}>
                <span className="flex items-center gap-2 text-sm text-white"><User className="h-4 w-4 text-zinc-500" /> {f.friendId || f.userId}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-black">SOHBET</span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 h-[600px] flex flex-col border-zinc-800 bg-zinc-900 text-zinc-100">
          {!otherId ? (
            <CardContent className="flex h-full flex-col items-center justify-center text-zinc-500"><MessageCircle className="h-12 w-12 mb-3 opacity-50" /><p>Arkadaş seç, DM başlat. Agent'ı birlikte kullanın.</p></CardContent>
          ) : (
            <>
              <CardHeader className="pb-2 border-b border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium text-white"><User className="h-5 w-5 text-zinc-400" /> {otherId}</span>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="rounded-full border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-white hover:text-black" onClick={exportDM}><HardDrive className="h-3 w-3" /> Drive Yedek</Button>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Çevrimiçi</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {dms.length === 0 ? <p className="text-center text-sm text-zinc-500">Henüz mesaj yok.</p> : dms.map((m) => (
                  <div key={m.id} className={`flex ${m.senderId === "me" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.senderId === "me" ? "bg-white text-black" : "bg-zinc-950 border border-zinc-800 text-zinc-100"}`}>
                      {m.content}
                      <div className="text-[10px] opacity-60 mt-1">{new Date(m.createdAt).toLocaleTimeString("tr-TR")}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
              <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="flex gap-2 border-t border-zinc-800 p-3">
                <Input placeholder="Mesaj yaz..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="bg-zinc-950 border-zinc-800 text-white" />
                <Button type="submit" className="rounded-full bg-white text-black hover:bg-zinc-200">Gönder</Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
