"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  MessageCircle,
  Trash2,
  Clock,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");

  async function load() {
    const res = await fetch("/api/chat", { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json();
    setChats(data.chats ?? []);
    setLoading(false);
  }

  async function createChat() {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle || "Yeni Sohbet" }),
      credentials: "include",
    });
    if (!res.ok) return;
    const data = await res.json();
    setChats([data.chat, ...chats]);
    setNewTitle("");
  }

  async function deleteChat(id: string) {
    if (!window.confirm("Sohbet silinsin mi?")) return;
    await fetch(`/api/chat/${id}`, { method: "DELETE", credentials: "include" });
    setChats(chats.filter((c) => c.id !== id));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sohbetler</h1>
          <p className="text-slate-600">Yapay zekâ sohbet geçmişinizi buradan yönetebilirsiniz.</p>
        </div>
        <Button onClick={() => document.getElementById("new-chat-input")?.focus()}>
          <Plus className="ml-2 h-4 w-4" /> Yeni Sohbet
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Input
          id="new-chat-input"
          placeholder="Sohbet başlığı (opsiyonel)"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createChat()}
        />
        <Button onClick={createChat}>Oluştur</Button>
      </div>

      {loading ? (
        <p className="text-slate-500">Yükleniyor...</p>
      ) : chats.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-slate-500">
            <MessageCircle className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            Henüz sohbet yok. Yeni bir sohbet oluşturarak başlayın.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {chats.map((chat) => (
            <Card
              key={chat.id}
              className="group cursor-pointer border-slate-100 hover:border-sucuk-200 hover:shadow-sm transition"
              onClick={() => {
                window.location.href = `/chat/${chat.id}`;
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sucuk-100 text-sucuk-600 shrink-0">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 group-hover:text-sucuk-600">
                      {chat.title}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {new Date(chat.updatedAt).toLocaleString("tr-TR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
