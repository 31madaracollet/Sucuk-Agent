"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Shield, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const accounts = [
    { label: "Yönetici", username: "Sucuk9977", password: "SigmaAkif2013", role: "admin" },
    { label: "Kullanıcı", username: "Pirensine", password: "2.0.2.7.F.Z.3102", role: "user" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Giriş başarısız.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Beklenmeyen hata.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md shadow-xl border-sucuk-100">
        <CardHeader className="text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sucuk-600 text-white mx-auto mb-3">
            <Shield className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl">Hesapla Giriş Yap</CardTitle>
          <CardDescription>
            Sadece var olan hesaplarla giriş yapılabilir. Kayıt paneli yoktur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 pl-3 pr-2 text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <Input
                placeholder="Kullanıcı adı"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="pl-9"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 pl-3 pr-2 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <Input
                type="password"
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-9"
              />
            </div>
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-100">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="border-t border-slate-200 pt-4 space-y-2">
            <p className="text-xs text-center text-slate-500 leading-none">
              Tanımlı hesaplar (demo):
            </p>
            {accounts.map((a) => (
              <div key={a.username} className="flex items-center justify-between p-2 rounded bg-slate-50 text-xs text-slate-600">
                <span className="font-medium">{a.label}</span>
                <span className="flex gap-1">
                  <span>{a.username}</span>
                  <span className="text-slate-400">/</span>
                  <span className="font-mono">{a.password}</span>
                </span>
                <BadgeMini role={a.role} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BadgeMini({ role }: { role: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
      role === "admin" ? "bg-sucuk-100 text-sucuk-700" : "bg-blue-100 text-blue-700"
    }`}>
      {role === "admin" ? "Yönetici" : "Kullanıcı"}
    </span>
  );
}
