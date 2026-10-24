"use client"
import { useEffect, useState } from "react"
import { Shield, Plus, Trash2, Users, Bell, Wrench, HardDrive, UserPlus, Layers, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"

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
  const [newRole, setNewRole] = useState<"user"|"admin">("user")
  const [loading, setLoading] = useState(true)

  async function load(){
    const [aRes,tRes,pRes]=await Promise.all([
      fetch("/api/announcements",{credentials:"include"}),
      fetch("/api/tools",{credentials:"include"}),
      fetch("/api/admin/users",{credentials:"include"}),
    ])
    const aData=await aRes.json(); const tData=await tRes.json(); const pData=await pRes.json()
    setAnnouncements(aData.announcements??[]); setTools(tData.tools??[]); setProfiles(pData.profiles??[]); setLoading(false)
  }
  useEffect(()=>{load()},[])
  async function addAnnouncement(){ if(!newTitle.trim()||!newContent.trim()) return; const res=await fetch("/api/announcements",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:newTitle,content:newContent}),credentials:"include"}); if(!res.ok) return; const data=await res.json(); setAnnouncements([data.announcement,...announcements]); setNewTitle(""); setNewContent("") }
  async function addTool(){ if(!toolName.trim()) return; const res=await fetch("/api/tools",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:toolName,description:toolDesc,config:{}}),credentials:"include"}); if(!res.ok) return; const data=await res.json(); setTools([data.tool,...tools]); setToolName(""); setToolDesc("") }
  async function addUser(){ if(!newUser.trim()||!newPass.trim()) return; const res=await fetch("/api/admin/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:newUser,password:newPass,role:newRole}),credentials:"include"}); const data=await res.json(); if(!res.ok){alert(data.error||"Eklenemedi"); return} setProfiles([...profiles,data.profile]); setNewUser(""); setNewPass("") }
  async function removeUser(id:string){ if(!confirm("Kullanıcı silinsin mi?")) return; const res=await fetch(`/api/admin/users?id=${id}`,{method:"DELETE",credentials:"include"}); const data=await res.json(); if(!res.ok){alert(data.error);return} setProfiles(profiles.filter(p=>p.id!==id))}
  async function removeTool(id:string){ await fetch(`/api/tools?id=${id}`,{method:"DELETE",credentials:"include"}); setTools(tools.filter(t=>t.id!==id)) }

  if(loading) return <div className="p-10 text-[var(--muted)]">Yükleniyor…</div>

  return (
    <>
      <Navbar/>
      <div className="flex">
        <Sidebar/>
        <div className="flex-1 min-w-0 bg-[var(--canvas)]">
          <div className="mx-auto max-w-[1000px] px-6 md:px-8 py-8 space-y-6">
            <div>
              <h1 className="font-display text-[28px] tracking-[-0.6px] flex items-center gap-2"><Shield className="h-5 w-5 text-[var(--coral)]"/> Yönetim</h1>
              <p className="text-sm text-[var(--muted)]">Sadece Sucuk9977 / SigmaAkif2013 — kullanıcı ata/çıkar, duyuru, araç ekle.</p>
            </div>

            <div className="card-claude p-6">
              <h3 className="font-medium flex items-center gap-2"><Users className="h-5 w-5 text-[var(--coral)]"/> Kullanıcılar — birlikte agent kullanma</h3>
              <p className="text-xs text-[var(--muted)] mt-1">Admin ekleyip çıkarır. Herkes aynı agent’ı kullanır, DM atabilir, Supabase’te izleri kalır.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Input placeholder="Kullanıcı adı" value={newUser} onChange={e=>setNewUser(e.target.value)} className="flex-1 min-w-[160px] bg-[var(--surface)] border-[var(--hairline)]"/>
                <Input placeholder="Şifre" value={newPass} onChange={e=>setNewPass(e.target.value)} className="flex-1 min-w-[140px] bg-[var(--surface)] border-[var(--hairline)]"/>
                <select value={newRole} onChange={e=>setNewRole(e.target.value as any)} className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] px-3 py-2 text-sm">
                  <option value="user">user</option><option value="admin">admin</option>
                </select>
                <Button onClick={addUser} className="btn-coral"><UserPlus className="h-4 w-4"/> Ekle</Button>
              </div>
              <div className="mt-4 grid gap-2">
                {profiles.map(p=>(
                  <div key={p.id} className="flex items-center justify-between rounded-[12px] border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3">
                    <div className="flex items-center gap-3">
                      <span className="h-8 w-8 rounded-full bg-[var(--ink)] text-[var(--canvas)] grid place-items-center text-xs font-bold">{p.username.slice(0,2).toUpperCase()}</span>
                      <div>
                        <p className="text-sm font-medium">{p.username} <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${p.role==="admin"?"bg-[var(--coral)] text-white":"bg-[var(--surface)] border border-[var(--hairline)] text-[var(--muted)]"}`}>{p.role}</span></p>
                        <p className="text-xs text-[var(--muted)]">{p.id} • {new Date(p.createdAt).toLocaleString("tr-TR")}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={()=>removeUser(p.id)} className="rounded-full bg-red-600 hover:bg-red-700 text-white"><Trash2 className="h-3 w-3"/></Button>
                  </div>
                ))}
                {profiles.length===0 && <p className="text-sm text-[var(--muted)] text-center py-4">Kullanıcı yok</p>}
              </div>
            </div>

            <div className="card-claude p-6">
              <h3 className="font-medium flex items-center gap-2"><Bell className="h-4 w-4 text-[var(--coral)]"/> Duyurular</h3>
              <div className="mt-3 flex gap-2">
                <Input placeholder="Başlık" value={newTitle} onChange={e=>setNewTitle(e.target.value)} className="bg-[var(--surface)] border-[var(--hairline)]"/>
                <Textarea placeholder="İçerik" value={newContent} onChange={e=>setNewContent(e.target.value)} rows={2} className="bg-[var(--surface)] border-[var(--hairline)] flex-1"/>
                <Button onClick={addAnnouncement} className="btn-coral">Yayımla</Button>
              </div>
              <div className="mt-4 space-y-2">
                {announcements.map(a=>(
                  <div key={a.id} className="rounded-[12px] border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3">
                    <div className="flex items-center justify-between"><span className="text-sm font-medium">{a.title}</span><span className="text-[10px] text-[var(--muted)]">{new Date(a.createdAt).toLocaleString("tr-TR")}</span></div>
                    <p className="text-sm text-[var(--muted)] mt-1">{a.content}</p>
                  </div>
                ))}
                {announcements.length===0 && <p className="text-sm text-[var(--muted)]">Duyuru yok.</p>}
              </div>
            </div>

            <div className="card-claude p-6">
              <h3 className="font-medium flex items-center gap-2"><Wrench className="h-4 w-4 text-[var(--coral)]"/> Dinamik araçlar</h3>
              <p className="text-xs text-[var(--muted)]">Sadece Sucuk9977 ekler — TeraBox, Drive, özel API’ler</p>
              <div className="mt-3 flex gap-2">
                <Input placeholder="Araç adı" value={toolName} onChange={e=>setToolName(e.target.value)} className="bg-[var(--surface)] border-[var(--hairline)]"/>
                <Input placeholder="Açıklama" value={toolDesc} onChange={e=>setToolDesc(e.target.value)} className="bg-[var(--surface)] border-[var(--hairline)]"/>
                <Button onClick={addTool} className="btn-coral"><Plus className="h-4 w-4"/> Ekle</Button>
              </div>
              <div className="mt-4 space-y-2">
                {tools.map(t=>(
                  <div key={t.id} className="flex items-center justify-between rounded-[12px] border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3">
                    <span className="text-sm">{t.name} <span className="text-xs text-[var(--muted)]">— {t.description}</span></span>
                    <Button size="sm" onClick={()=>removeTool(t.id)} className="rounded-full bg-red-600 text-white"><Trash2 className="h-3 w-3"/></Button>
                  </div>
                ))}
                {tools.length===0 && <p className="text-sm text-[var(--muted)]">Araç yok.</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="card-claude p-6 text-center">
                <HardDrive className="mx-auto h-8 w-8 text-[var(--coral)] mb-2"/><p className="text-sm font-medium">Supabase + Drive</p><p className="text-xs text-[var(--muted)]">Sohbetler DB’de, Drive JSON yedeği tek tık.</p>
              </div>
              <div className="card-claude p-6 text-center">
                <Layers className="mx-auto h-8 w-8 text-[var(--coral)] mb-2"/><p className="text-sm font-medium">Ortak Agent</p><p className="text-xs text-[var(--muted)]">Tüm kullanıcılar aynı agent’ı kullanır, görev beleşe dağılır.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
