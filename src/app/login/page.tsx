"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Lock, ArrowRight, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const accounts = [
    { label: "Yönetici", username: "Sucuk9977", password: "SigmaAkif2013" },
    { label: "Kullanıcı", username: "Pirensine", password: "2.0.2.7.F.Z.3102" },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Giriş başarısız.")
        setLoading(false)
        return
      }
      // Cookie HttpOnly olduğu için JS okuyamaz, hard redirect gerekir
      window.location.href = "/dashboard"
    } catch (err: any) {
      setError(err?.message || "Beklenmeyen hata.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 to-zinc-950" />
      <Card className="relative w-full max-w-md border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black">
            <Bot className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl tracking-tight">Siyah • Beyaz • Cihaz</CardTitle>
          <CardDescription className="text-zinc-400">Sadece var olan hesaplarla giriş. Kayıt yok — admin ekler.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              placeholder="Kullanıcı adı"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500"
            />
            <Input
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500"
            />
            {error && <div className="rounded-xl border border-red-900 bg-red-950 p-3 text-sm text-red-200">{error}</div>}
            <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200 rounded-full" disabled={loading}>
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
          <div className="border-t border-zinc-800 pt-4 space-y-2">
            <p className="text-center text-xs text-zinc-500">Tanımlı hesaplar</p>
            {accounts.map((a) => (
              <button
                key={a.username}
                onClick={() => { setUsername(a.username); setPassword(a.password) }}
                className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs hover:border-white transition"
              >
                <span className="font-medium">{a.label}</span>
                <span className="font-mono text-zinc-400">{a.username} / {a.password}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-black">DOLDUR</span>
              </button>
            ))}
            <p className="text-center text-[11px] text-zinc-600">Admin panelinden yeni kullanıcı ekleyebilirsin. Şifreler hash'lenir, Supabase'e yazılır.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
