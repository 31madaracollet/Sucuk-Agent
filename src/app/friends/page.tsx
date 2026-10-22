"use client";

import { useEffect, useState } from "react";
import {
  Users,
  User,
  UserPlus,
  MessageCircle,
  CheckCircle2,
  Clock,
  Search as SearchIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function FriendsPage() {
  const [friendships, setFriendships] = useState<any[]>([]);
  const [dms, setDms] = useState<any[]>([]);
  const [otherId, setOtherId] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [addId, setAddId] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const [fRes, mRes] = await Promise.all([
      fetch("/api/friends", { credentials: "include" }),
      otherId ? fetch(`/api/messages?otherId=${otherId}`, { credentials: "include" }) : Promise.resolve({ json: async () => ({ messages: [] }) }),
    ]);
    const fData = await fRes.json();
    setFriendships(fData.friendships ?? []);
    if (otherId) {
      const mData = await mRes.json();
      setDms(mData.messages ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addFriend() {
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId: addId }),
      credentials: "include",
    });
    if (!res.ok) return;
    setAddId("");
    load();
  }

  async function sendMessage() {
    if (!newMessage.trim() || !otherId) return;
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: otherId, content: newMessage }),
      credentials: "include",
    });
    setNewMessage("");
    load();
  }

  if (loading) return <div className="flex-1 p-10 text-slate-500">Yükleniyor...</div>;

  const accepted = friendships.filter(
    (f) => f.status === "accepted" && (f.userId !== f.friendId)
  );
  const pending = friendships.filter((f) => f.status === "pending");

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Arkadaşlar &amp; Mesajlar</h1>
          <p className="text-slate-600">Kullanıcılar arası sohbet ve arkadaşlık sistemi.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Arkadaş ekle */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> Arkadaş Ekle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Arkadaş kullanıcı kimliği (örn. Pirensine)"
                value={addId}
                onChange={(e) => setAddId(e.target.value)}
              />
              <Button onClick={addFriend}>Ekle</Button>
            </div>
            <p className="text-xs text-slate-500">
              Arkadaşlık isteği gönderilir; karşı taraf onaylayınca sohbet başlatılabilir.
            </p>
          </CardContent>
        </Card>

        {/* Bekleyen istekler */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" /> Bekleyen İstekler
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Bekleyen istek yok.</p>
            ) : (
              <div className="space-y-2">
                {pending.map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-2 rounded bg-amber-50">
                    <span className="text-sm">{f.friendId}</span>
                    <Button size="sm" onClick={() => {}}>Onayla</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Arkadaş listesi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Arkadaşlarınız
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {accepted.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Henüz arkadaş yok.</p>
            ) : (
              <div className="space-y-2">
                {accepted.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setOtherId(f.friendId || f.userId);
                      load();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-50 text-left transition"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-700">{f.friendId || f.userId}</span>
                    </div>
                    <Badge variant="success">Sohbet</Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sohbet alanı */}
        <Card className="lg:col-span-2 h-[600px] flex flex-col border-slate-200">
          {!otherId ? (
            <CardContent className="flex flex-col items-center justify-center h-full text-slate-400">
              <MessageCircle className="h-12 w-12 mb-3 opacity-50" />
              <p>Sohbet başlatmak için bir arkadaş seçin.</p>
            </CardContent>
          ) : (
            <>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-slate-500" />
                    <span className="font-medium text-slate-900">{otherId}</span>
                  </div>
                  <span className="text-[10px] text-green-600 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    Çevrimiçi
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {dms.length === 0 ? (
                  <p className="text-center text-sm text-slate-500">Henüz mesaj yok.</p>
                ) : (
                  <div className="space-y-4">
                    {dms.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${
                          m.senderId === "me" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div className={`max-w-[75%] rounded-2xl p-3 ${
                          m.senderId === "me"
                            ? "bg-sucuk-600 text-white ml-auto"
                            : "bg-slate-100 text-slate-800"
                        }`}>
                          {m.content}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(m.createdAt).toLocaleTimeString("tr-TR")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="p-3 border-t border-slate-200 bg-white flex gap-2"
              >
                <Input
                  placeholder="Mesaj yazın..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <Button type="submit" disabled={!newMessage.trim()}>
                  <MessageCircle className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
