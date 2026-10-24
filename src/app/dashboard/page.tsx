"use client"
import { useEffect, useState } from "react"
import { Plus, MessageCircle, Trash2, Sparkles, HardDrive, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"

export default function DashboardPage() {
  const [chats, setChats] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState("")
  const [autoCreating, setAutoCreating] = useState(false)

  async function load() {
    const [cRes, aRes] = await Promise.all([
      fetch("/api/chat", { credentials: "include" }),
      fetch("/api/announcements", { credentials: "include" }),
    ])
    const cData = await cRes.json()
    const aData = await aRes.json()
    setChats(cData.chats ?? [])
    setAnnouncements(aData.announcements ?? [])
    setLoading(false)
    // Otomatik yeni sohbet ARTIK otomatik yönlendirme yapmıyor — kullanıcı geri basmadan geri gitmeyecek
    // Sadece boş ise bilgi göster, kullanıcı isterse oluştursun
  }

  async function createChat() {
    try{
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle || "Yeni Sohbet" }),
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok){ alert(data.error || "Oluşturulamadı - giriş yap"); return }
      setChats([data.chat, ...chats])
      setNewTitle("")
      window.location.href = `/chat/${data.chat.id}?fullscreen=1`
    }catch(e:any){ alert("Hata: "+e.message)}
  }

  async function deleteChat(id: string) {
    if (!window.confirm("Sohbet silinsin mi?")) return
    await fetch(`/api/chat/${id}`, { method: "DELETE", credentials: "include" })
    setChats(chats.filter((c) => c.id !== id))
  }

  async function exportAll() {
    const data = await Promise.all(chats.map(async (c) => {
      const r = await fetch(`/api/chat/${c.id}`, { credentials: "include" })
      const j = await r.json()
      return { chat: j.chat, messages: j.messages }
    }))
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), chats: data }, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sucuk-agent-yedek-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function downloadPDF() {
    // Tüm sohbetleri PDF olarak indir
    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text("Sucuk-Agent Sohbet Yedeği", 10, 15)
    doc.setFontSize(10)
    let y=25
    for(const c of chats.slice(0,10)){
      doc.text(`${c.title} — ${new Date(c.updatedAt).toLocaleString("tr-TR")}`, 10, y)
      y+=7
      if(y>280){ doc.addPage(); y=15 }
    }
    doc.save(`sucuk-agent-${new Date().toISOString().slice(0,10)}.pdf`)
  }

  useEffect(() => { load() }, [])

  return (
    <>
      <Navbar/>
      <div className="flex">
        <Sidebar/>
        <div className="flex-1 mx-auto max-w-5xl px-4 md:px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-zinc-400" /> Sohbetler
          </h1>
          <p className="text-sm text-zinc-500">Supabase'e yazılır • Drive'a tek tık yedek • Arkadaşlarınla DM • Kalıcı geçmiş</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-full border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-white hover:text-black" onClick={downloadPDF}>
            PDF İndir
          </Button>
          <Button variant="outline" className="rounded-full border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-white hover:text-black" onClick={exportAll}>
            <HardDrive className="h-4 w-4" /> Drive'a Yedekle
          </Button>
          <Button className="rounded-full bg-white text-black hover:bg-zinc-200" onClick={() => document.getElementById("new-chat-input")?.focus()}>
            <Plus className="h-4 w-4" /> Yeni Sohbet
          </Button>
        </div>
      </div>

      {announcements.length > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs font-semibold tracking-widest text-zinc-400">DUYURULAR</p>
          <div className="mt-2 space-y-2">
            {announcements.slice(0, 3).map((a: any) => (
              <div key={a.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <p className="text-sm font-medium text-white">{a.title}</p>
                <p className="text-xs text-zinc-400">{a.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-2">
        <Input
          id="new-chat-input"
          placeholder="Yeni sohbet başlığı — örn. Köpek çiz, Python dersi"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createChat()}
          className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500"
        />
        <Button onClick={createChat} className="rounded-full bg-white text-black hover:bg-zinc-200">
          Oluştur <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-2">
        <div className="flex items-center justify-between px-3 py-2 text-xs text-zinc-500">
          <span>Sohbetler ({chats.length}) — 1 hafta kullanılmayan silinir (admin hariç)</span>
          <span className="hidden sm:inline">Supabase • Vercel • Drive</span>
        </div>
        {loading ? (
          <p className="px-3 py-6 text-sm text-zinc-500">Yükleniyor...</p>
        ) : chats.length === 0 ? (
          <Card className="border-zinc-800 bg-zinc-950">
            <CardContent className="py-12 text-center text-zinc-500">
              <MessageCircle className="mx-auto h-8 w-8 text-zinc-600 mb-3" /> {autoCreating ? "Otomatik sohbet oluşturuluyor..." : "Henüz sohbet yok. Başlık yaz ve oluştur — Agent gerisini halleder."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => (window.location.href = `/chat/${chat.id}?fullscreen=1`)}
                className="group flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3 hover:border-white hover:bg-zinc-900 cursor-pointer transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shrink-0"><MessageCircle className="h-4 w-4" /></div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{chat.title}</p>
                    <p className="truncate text-xs text-zinc-500">{new Date(chat.updatedAt).toLocaleString("tr-TR")}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="opacity-0 group-hover:opacity-100 border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-white hover:text-black rounded-full"
                  onClick={(e) => { e.stopPropagation(); deleteChat(chat.id) }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm font-medium">Birlikte kullan</p>
          <p className="text-xs text-zinc-500 mt-1">Arkadaşlar → ekle/onayla, DM'den foto/video/ses gönder, Drive'a yüklenir. Varsayılan hesaplar zaten arkadaş.</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm font-medium">Kod Editör</p>
          <p className="text-xs text-zinc-500 mt-1">Üstten Editör'e gir — AI orada kod yazar, test eder, GitHub'a pushlar.</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm font-medium">Yedek</p>
          <p className="text-xs text-zinc-500 mt-1">Sohbetler Supabase'te kalıcı, sebzepsiz silinmez. Haftalık temizlik sadece 1 haftadır kullanılmayanları atar (admin hariç).</p>
        </div>
      </div>
        </div>
      </div>
    </>
  )
}
