"use client"
import { useState } from "react"
import { Bot, ArrowRight, ShieldCheck, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const accounts = [
    { label: "Yonetici", username: "Sucuk9977", password: "SigmaAkif2013", role: "ADMIN" },
    { label: "Kullanici", username: "Pirensine", password: "2.0.2.7.F.Z.3102", role: "USER" },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(""); setLoading(true)
    try {
      const res = await fetch("/api/auth/signin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }), credentials: "include" })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Giris basarisiz."); setLoading(false); return }
      // per-tab session — iki farkli hesap ayni tarayicide karismasin
      try {
        if (data.token) {
          sessionStorage.setItem("sucuk_session_tab", data.token)
          localStorage.setItem("sucuk_session_persist", data.token)
          if (data.user) {
            sessionStorage.setItem("sucuk_user_tab", JSON.stringify(data.user))
          }
        }
      } catch {}
      window.location.href = "/dashboard"
    } catch (err:any) { setError(err?.message || "Beklenmeyen hata."); setLoading(false) }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-[1.15fr_0.85fr] bg-[var(--canvas)]">
      {/* Sol — editorial */}
      <div className="hidden md:flex flex-col justify-between p-10 bg-[var(--ink)] text-[var(--canvas)]">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-[10px] bg-[var(--canvas)] text-[var(--ink)] grid place-items-center"><Bot className="h-5 w-5"/></span>
            <span className="font-display text-[20px]">Sucuk<span className="font-light opacity-70">Agent</span></span>
          </div>
          <h1 className="font-display text-[44px] leading-[1.05] tracking-[-1px] mt-12 text-balance">
            Dusunen partnerin,<br />
            <span className="italic text-[var(--coral)]">kagitta</span> ve cihazda.
          </h1>
          <p className="mt-6 text-[16px] leading-[1.6] text-white/70 max-w-[520px]">
            Warm parchment gunduz, OLED gece. Orchestrator beles modellere oncelik verir — kod, gorsel, akil. Supabase kalici, Drive oto-yedek, artifact sagda.
          </p>
          <div className="mt-8 grid gap-3 max-w-[520px]">
            <div className="rounded-[12px] border border-white/10 bg-white/5 p-4 flex items-center gap-3">
              <span className="h-8 w-8 rounded-[8px] bg-white text-black grid place-items-center"><BookOpen className="h-4 w-4"/></span>
              <div>
                <p className="text-sm font-medium">Claude editorial</p>
                <p className="text-xs text-white/60">Cream #faf9f5, ink #141413, coral #cc785c, hairline #e6dfd8</p>
              </div>
            </div>
            <div className="rounded-[12px] border border-white/10 bg-white/5 p-4 flex items-center gap-3">
              <span className="h-8 w-8 rounded-[8px] bg-[var(--coral)] text-white grid place-items-center"><ShieldCheck className="h-4 w-4"/></span>
              <div>
                <p className="text-sm font-medium">Kayit yok — sadece giris</p>
                <p className="text-xs text-white/60">Admin ekler, sifreler hashlenir, 7 gun HttpOnly cerez + per-tab token (iki oturum karismaz)</p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-white/40">Sucuk-Agent • Editorial gunduz, cihaz gece • Supabase + Vercel + Drive</p>
      </div>

      {/* Sag — form */}
      <div className="flex items-center justify-center p-6 md:p-10 bg-[var(--canvas)]">
        <div className="w-full max-w-[420px]">
          <div className="md:hidden flex items-center gap-2 mb-6">
            <span className="h-8 w-8 rounded-[10px] bg-[var(--ink)] text-[var(--canvas)] grid place-items-center"><Bot className="h-4 w-4"/></span>
            <span className="font-display text-[18px]">SucukAgent</span>
          </div>

          <h2 className="font-display text-[28px] tracking-[-0.5px]">Giris yap</h2>
          <p className="text-sm text-[var(--muted)] mt-2">Sadece var olan hesaplarla — kayit paneli yok, admin ekler. Iki ayri sekmede farkli hesap acabilirsin, karismaz.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <div>
              <label className="text-xs font-medium text-[var(--muted)]">Kullanici adi</label>
              <Input placeholder="Sucuk9977 veya Pirensine" value={username} onChange={e=>setUsername(e.target.value)} required className="mt-1 bg-[var(--surface)] border-[var(--hairline)] focus:border-[var(--coral)] focus:ring-[var(--coral)]/20" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted)]">Sifre</label>
              <Input type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required className="mt-1 bg-[var(--surface)] border-[var(--hairline)]" />
            </div>
            {error && <div className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <Button type="submit" disabled={loading} className="w-full btn-coral mt-2">
              {loading ? "Giris yapiliyor…" : "Giris Yap"} <ArrowRight className="ml-2 h-4 w-4"/>
            </Button>
            <p className="text-center text-[11px] text-[var(--muted)]">Secure HttpOnly + per-tab token • SameSite Lax • 7 gun</p>
          </form>

          <div className="mt-8 border-t border-[var(--hairline)] pt-6 space-y-2">
            <p className="text-xs font-semibold tracking-[0.08em] text-[var(--muted)]">TANIMLI HESAPLAR — DOKUN DOLDUR</p>
            {accounts.map(a=>(
              <button key={a.username} onClick={()=>{setUsername(a.username); setPassword(a.password)}} className="flex w-full items-center justify-between rounded-[12px] border border-[var(--hairline)] bg-[var(--surface)] px-4 py-3 text-left hover:border-[var(--coral)] hover:bg-[var(--surface-cream)] transition">
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">{a.label} <span className="rounded-full bg-[var(--ink)] text-[var(--canvas)] px-2 py-0.5 text-[10px] font-bold">{a.role}</span></p>
                  <p className="text-xs font-mono text-[var(--muted)] mt-0.5">{a.username} / {a.password}</p>
                </div>
                <span className="rounded-full bg-[var(--coral)] text-white px-3 py-1 text-xs font-bold">Doldur</span>
              </button>
            ))}
            <p className="text-[11px] text-[var(--muted)] text-center">Admin panelinden yeni kullanici ekleyebilirsin. Sifreler hashlenir, Supabase'e yazilir.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
