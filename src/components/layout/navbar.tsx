"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Bot, Shield, Users, MessageCircle, Settings, LogOut, Menu, X, Sparkles } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"

const navItems = [
  { href: "/dashboard", label: "Sohbetler", icon: MessageCircle },
  { href: "/friends", label: "Arkadaşlar", icon: Users },
  { href: "/settings", label: "Ayarlar", icon: Settings },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<{ username: string; role: string } | null>(null)

  useEffect(() => {
    // client-side cookie yok, ama local /api/auth/me üzerinden de alınabilir; basit fallback
    try {
      const m = document.cookie.match(/sucuk_session=([^;]+)/)
      if (m) {
        const payload = JSON.parse(atob(m[1].split(".")[0].replace(/-/g, "+").replace(/_/g, "/")))
        setUser({ username: payload.u, role: payload.r })
      }
    } catch {}
  }, [])

  // getCurrentUser client'ta çalışmaz (next/headers), yukarıdaki cookie parse yeterli
  if (!user) {
    // Navbar'ı yine göster ama giriş iste
    return (
      <nav className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 md:px-6 py-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black font-bold text-xs">SA</div>
            <span className="text-sm font-semibold tracking-tight">Sucuk<span className="font-light text-zinc-400">Agent</span></span>
          </Link>
          <Link href="/login" className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-100">Giriş</Link>
        </div>
      </nav>
    )
  }

  const isAdmin = user.role === "admin"

  return (
    <nav className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 md:px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">
              <Bot className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Sucuk<span className="font-light text-zinc-400">Agent</span></span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[10px] tracking-wide text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> SİYAH • BEYAZ • CİHAZ
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((it) => {
              const Icon = it.icon
              return (
                <Link key={it.href} href={it.href} className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white transition">
                  <Icon className="h-4 w-4" /> {it.label}
                </Link>
              )
            })}
            {isAdmin && (
              <Link href="/admin" className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white transition">
                <Shield className="h-4 w-4" /> Yönetim
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-white" /> {user.username}
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-black">{isAdmin ? "ADMIN" : "USER"}</span>
          </span>
          <button
            onClick={() => {
              document.cookie = "sucuk_session=; Path=/; Max-Age=0"
              window.location.href = "/login"
            }}
            className="hidden sm:flex items-center gap-2 rounded-full border border-zinc-800 px-3 py-2 text-sm text-zinc-400 hover:bg-white hover:text-black transition"
          >
            <LogOut className="h-4 w-4" /> Çıkış
          </button>
          <button className="md:hidden p-2 text-zinc-400" onClick={() => setOpen((o) => !o)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950">
          <div className="px-4 py-3 grid gap-1">
            {navItems.map((it) => {
              const Icon = it.icon
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm text-zinc-300 hover:bg-zinc-900"
                >
                  <Icon className="h-4 w-4" /> {it.label}
                </Link>
              )
            })}
            {isAdmin && (
              <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm text-zinc-300 hover:bg-zinc-900">
                <Shield className="h-4 w-4" /> Yönetim
              </Link>
            )}
            <button
              onClick={() => {
                document.cookie = "sucuk_session=; Path=/; Max-Age=0"
                window.location.href = "/login"
                setOpen(false)
              }}
              className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm text-red-400 hover:bg-zinc-900"
            >
              <LogOut className="h-4 w-4" /> Çıkış
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
