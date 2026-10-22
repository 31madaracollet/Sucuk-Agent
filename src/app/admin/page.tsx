"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  Plus,
  Trash2,
  User,
  MessageCircle,
  FileCode,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [toolName, setToolName] = useState("");
  const [toolDesc, setToolDesc] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const [aRes, tRes] = await Promise.all([
      fetch("/api/announcements", { credentials: "include" }),
      fetch("/api/tools", { credentials: "include" }),
    ]);
    const aData = await aRes.json();
    const tData = await tRes.json();
    setAnnouncements(aData.announcements ?? []);
    setTools(tData.tools ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addAnnouncement() {
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, content: newContent }),
      credentials: "include",
    });
    if (!res.ok) return;
    const data = await res.json();
    setAnnouncements([data.announcement, ...announcements]);
    setNewTitle("");
    setNewContent("");
  }

  async function addTool() {
    const res = await fetch("/api/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: toolName, description: toolDesc, config: {} }),
      credentials: "include",
    });
    if (!res.ok) return;
    const data = await res.json();
    setTools([data.tool, ...tools]);
    setToolName("");
    setToolDesc("");
  }

  async function removeTool(id: string) {
    await fetch(`/api/tools?id=${id}`, { method: "DELETE", credentials: "include" });
    setTools(tools.filter((t) => t.id !== id));
  }

  if (loading) return <div className="flex-1 p-10 text-slate-500">Yükleniyor...</div>;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Yönetim Paneli</h1>
          <p className="text-slate-600">Sadece Yönetici Hesabı (Sucuk9977) erişebilir.</p>
        </div>
      </div>

      {/* Duyurular */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Sistem Duyuruları
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <div className="flex gap-2">
              <Input
                placeholder="Duyuru başlığı"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <Textarea
                placeholder="İçerik"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={2}
              />
              <Button onClick={addAnnouncement}>Yayımla</Button>
            </div>
          </div>
          <div className="space-y-2">
            {announcements.length === 0 && (
              <p className="text-sm text-slate-500">Duyuru yok.</p>
            )}
            {announcements.map((a) => (
              <div key={a.id} className="p-3 rounded bg-blue-50 border border-blue-100 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-blue-800">{a.title}</span>
                  <span className="text-[10px] text-blue-500">
                    {new Date(a.createdAt).toLocaleString("tr-TR")}
                  </span>
                </div>
                <p className="text-slate-700">{a.content}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dinamik araçlar */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5" /> Dinamik Araç Entegrasyonu
            </CardTitle>
            <p className="text-xs text-slate-500">Yalnızca yöneticiyetkisiyle</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Araç adı (örn. TeraBox Bağlantısı)"
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
            />
            <Input
              placeholder="Açıklama"
              value={toolDesc}
              onChange={(e) => setToolDesc(e.target.value)}
            />
            <Button onClick={addTool}>Ekle</Button>
          </div>
          <p className="text-xs text-slate-500">
            Sistem, kod yazarak kendi reposuna yeni araç bağlantıları ekleyebilir.
            Bu işlem yönetici hesabıyla kısıtlanmıştır.
          </p>
          <div className="space-y-2">
            {tools.length === 0 && <p className="text-sm text-slate-500">Eklenen araç yok.</p>}
            {tools.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-2 rounded bg-slate-50">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-700">{t.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">{t.description}</span>
                  <Button size="sm" variant="destructive" onClick={() => removeTool(t.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <MessageCircle className="mx-auto h-10 w-10 text-slate-400 mb-3" />
            <p className="text-xs text-slate-500 mb-1">Kullanıcı Yönetimi</p>
            <p className="text-xs text-slate-400">
              Yeni kullanıcı ekleme / çıkarma yetkisi burada yer alır.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="mx-auto h-10 w-10 text-slate-400 mb-3" />
            <p className="text-xs text-slate-500 mb-1">Sistem Duyuru Akışı</p>
            <p className="text-xs text-slate-400">
              Tüm kullanıcılara yayınlanan genel duyurular.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
