"use client"

import { useEffect, useState } from "react"
import { Shield, Plus, Trash2, Users, Bell, Wrench, HardDrive, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [tools, setTools] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  const [toolName, setToolName] = useState("")
  const [toolDesc, setToolDesc] = useState("")
  const [newUser, setNewUser] = useState("")
  const [newPass, setNewPass] = useState("")
  const [newRole, setNewRole] = useState<"user" | "admin">("user")
  const [loading, setLoading] = useState(true)

  async function load() {
    const [aRes, tRes, pRes] = await Promise.all([
      fetch("/api/announcements", { credentials: "include" }),
      fetch("/api/tools", { credentials: "include" }),
      fetch("/api/admin/users", { credentials: "include" }),
    ])
    const aData = await aRes.json()
    const tData = await tRes.json()
    const pData = await pRes.json()
    setAnnouncements(aData.announcements ?? [])
    setTools(tData.tools ?? [])
    setProfiles(pData.profiles ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addAnnouncement() {
    if (!newTitle.trim() || !newContent.trim()) return
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, content: newContent }),
      credentials: "include",
    })
    if (!res.ok) return
    const data = await res.json()
    setAnnouncements([data.announcement, ...announcements])
    setNewTitle("")
    setNewContent("")
  }

  async function addTool() {
    if (!toolName.trim()) return
    const res = await fetch("/api/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: toolName, description: toolDesc, config: {} }),
      credentials: "include",
    })
    if (!res.ok) return
    const data = await res.json()
    setTools([data.tool, ...tools])
    setToolName("")
    setToolDesc("")
  }

  async function addUser() {
    if (!newUser.trim() || !newPass.trim()) return
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUser, password: newPass, role: newRole }),
      credentials: "include",
    })
    const data = await res.json()
    if (!res.ok) { alert(data.error || "Eklenemedi"); return }
    setProfiles([...profiles, data.profile])
    setNewUser("")
    setNewPass("")
  }

  async function removeUser(id: string) {
    if (!confirm("Kullanıcı silinsin mi?")) return
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE", credentials: "include" })
    const data = await res.json()
    if (!res.ok) { alert(data.error); return }
    setProfiles(profiles.filter((p) => p.id !== id))
  }

  async function removeTool(id: string) {
    await fetch(`/api/tools?id=${id}`, { method: "DELETE", credentials: "include" })
    setTools(tools.filter((t) => t.id !== id))
  }

  if (loading) return <div className="p-10 text-zinc-500">Yükleniyor...</div>

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2"><Shield className="h-5 w-5" /> Yönetim</h1>
        <p className="text-sm text-zinc-500">Sadece Sucuk9977 / SigmaAkif2013 — kullanıcı ata/çıkar, duyuru, araç ekle. Siyah-beyaz cihaz.</p>
      </div>

      {/* Kullanıcı yönetimi — yeni */}
      <Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white"><Users className="h-5 w-5" /> Kullanıcılar — birlikte agent kullanma</CardTitle>
          <p className="text-xs text-zinc-400">Admin kullanıcı ekleyip çıkarabilir. Eklenen herkes Agent'ı birlikte kullanır, arkadaş olarak DM atabilir, aynı duyuruları görür, Supabase'te izleri kalır.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input placeholder="Kullanıcı adı (örn. YeniKullanici)" value={newUser} onChange={(e) => setNewUser(e.target.value)} className="flex-1 min-w-[160px] bg-zinc-950 border-zinc-800 text-white" />
            <Input placeholder="Şifre" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="flex-1 min-w-[140px] bg-zinc-950 border-zinc-800 text-white" />
            <select value={newRole} onChange={(e) => setNewRole(e.target.value as any)} className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white">
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
            <Button onClick={addUser} className="rounded-full bg-white text-black hover:bg-zinc-200"><UserPlus className="h-4 w-4" /> Ekle</Button>
          </div>
          <div className="grid gap-2">
            {profiles.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black text-xs font-bold">{p.username.slice(0,2).toUpperCase()}</div>
                  <div>
                    <p className="text-sm font-medium text-white">{p.username} <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${p.role === "admin" ? "bg-white text-black" : "bg-zinc-800 text-zinc-300"}`}>{p.role}</span></p>
                    <p className="text-xs text-zinc-500">{p.id} • {new Date(p.createdAt).toLocaleString("tr-TR")}</p>
                  </div>
                </div>
                <Button size="sm" variant="destructive" className="rounded-full bg-red-600 hover:bg-red-700" onClick={() => removeUser(p.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {profiles.length === 0 && <p className="text-sm text-zinc-500 text-center py-4">Kullanıcı yok</p>}
          </div>
          <p className="text-xs text-zinc-500">İpucu: Eklenen kullanıcılar login'de kendi şifreleriyle girer. Admin duyuru atar, araç ekler, arkadaşları yönetir. Sohbet geçmişi Supabase'te, Drive yedekle korunur.</p>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white"><Bell className="h-5 w-5" /> Duyurular</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="Başlık" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="bg-zinc-950 border-zinc-800 text-white" />
            <Textarea placeholder="İçerik" value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={2} className="bg-zinc-950 border-zinc-800 text-white flex-1" />
            <Button onClick={addAnnouncement} className="rounded-full bg-white text-black hover:bg-zinc-200">Yayımla</Button>
          </div>
          <div className="space-y-2">
            {announcements.map((a) => (
              <div key={a.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{a.title}</span>
                  <span className="text-[10px] text-zinc-500">{new Date(a.createdAt).toLocaleString("tr-TR")}</span>
                </div>
                <p className="text-sm text-zinc-400">{a.content}</p>
              </div>
            ))}
            {announcements.length === 0 && <p className="text-sm text-zinc-500">Duyuru yok.</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white"><Wrench className="h-5 w-5" /> Dinamik Araçlar (250 entegrasyon altyapısı)</CardTitle>
          <p className="text-xs text-zinc-500">Sadece Sucuk9977 ekleyebilir — ör. TeraBox, Drive, özel API'ler</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="Araç adı" value={toolName} onChange={(e) => setToolName(e.target.value)} className="bg-zinc-950 border-zinc-800 text-white" />
            <Input placeholder="Açıklama" value={toolDesc} onChange={(e) => setToolDesc(e.target.value)} className="bg-zinc-950 border-zinc-800 text-white" />
            <Button onClick={addTool} className="rounded-full bg-white text-black hover:bg-zinc-200"><Plus className="h-4 w-4" /> Ekle</Button>
          </div>
          <div className="space-y-2">
            {tools.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <span className="text-sm text-white">{t.name} <span className="text-zinc-500 text-xs">— {t.description}</span></span>
                <Button size="sm" variant="destructive" className="rounded-full" onClick={() => removeTool(t.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
            {tools.length === 0 && <p className="text-sm text-zinc-500">Araç yok.</p>}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-center">
          <HardDrive className="mx-auto h-8 w-8 text-zinc-500 mb-2" />
          <p className="text-sm font-medium text-white">Supabase + Drive</p>
          <p className="text-xs text-zinc-500">Sohbetler DB'de, Drive JSON yedeği dashboard'dan tek tık.</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-center">
          <Shield className="mx-auto h-8 w-8 text-zinc-500 mb-2" />
          <p className="text-sm font-medium text-white">Ortak Agent</p>
          <p className="text-xs text-zinc-500">Tüm kullanıcılar aynı Agent'ı kullanır, görevbeleşe göre dağılır.</p>
        </div>
      </div>
    </div>
  )
}
