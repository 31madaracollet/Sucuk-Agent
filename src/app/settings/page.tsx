"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  Key,
  Bot as BotIcon,
  Database,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const [providers, setProviders] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/providers", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setProviders(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Ayarlar</h1>
          <p className="text-slate-600">Sistem yapılandırması ve API sağlayıcı durumu.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" /> API Sağlayıcı Durumu
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-500">Yükleniyor...</p>
          ) : providers ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-slate-600 border-b pb-2">
                <span>Kimlik durumu</span>
                <Badge variant={providers.authenticated ? "success" : "danger"}>
                  {providers.authenticated ? "Oturum açtı" : "Oturum yok"}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase">
                  Sağlayıcılar (anahtar sayısı)
                </p>
                {Object.entries(providers.keyCounts || {}).map(([p, c]) => (
                  <div key={p} className="flex items-center justify-between p-2 rounded bg-slate-50">
                    <span className="text-sm text-slate-700 capitalize">{p}</span>
                    <span className="text-xs font-mono text-slate-500">
                      {String(c)} anahtar
                    </span>
                  </div>
                ))}
                {Object.keys(providers.keyCounts || {}).length === 0 && (
                  <p className="text-sm text-slate-500">
                    Yapılandırılmış API anahtarı yok. Ortam değişkenlerini ekleyin.
                  </p>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Kotaları biten sağlayıcılarda otomatik diğer anahtara geçiş yapılır;
                tümleri bitince "Üzgünüm, limit doldu." uyarısı verilir ve Düz Sohbet
                Moduna geçilir.
              </p>
            </div>
          ) : (
            <p className="text-slate-500">Veri alınamadı.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> Hesap Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded bg-slate-50 border border-slate-100">
              <div className="text-xs text-slate-500 uppercase">Tanımlı Hesaplar</div>
              <div className="mt-1 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Sucuk9977</span>
                  <Badge variant="secondary">Yönetici</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Pirensine</span>
                  <Badge variant="default">Kullanıcı</Badge>
                </div>
              </div>
            </div>
            <div className="p-3 rounded bg-slate-50 border border-slate-100">
              <div className="text-xs text-slate-500 uppercase">Sohbet Geçmişi</div>
              <div className="mt-1 text-sm text-slate-600">
                Tüm sohbetler Supabase veritabanına kaydedilir ve Google Drive
                üzerinden yedeklenir.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
