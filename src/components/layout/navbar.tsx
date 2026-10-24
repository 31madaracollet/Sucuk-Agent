"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Bot, Shield, Users, MessageCircle, Settings, LogOut, Menu, X, Plug, Bell, Code2 } from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Sohbet", icon: MessageCircle, hint: "Sohbet ekranı: tüm konuşmaların, Drive yedek тут" },
  { href: "/friends", label: "Arkadaşlar", icon: Users, hint: "Arkadaş ekle & DM (Supabase realtime) + Drive yedek" },
  { href: "/editor", label: "Editör", icon: Code2, hint: "Yerleşik Kod Editörü — AI yazar/test eder" },
  { href: "/workspace", label: "Projeler", icon: Plug, hint: "Arkadaşlarla proje yap & Bağlantılar/Araçlar" },
  { href: "/settings", label: "Ayarlar", icon: Settings, hint: "Ayarlar" },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<{ username: string; role: string } | null>(null)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    // HttpOnly cookie JS'ten okunamaz - /api/auth/me ile al
    const loadUser = async () => {
      try {
        const r = await fetch("/api/auth/me", { credentials: "include" })
        const j = await r.json()
        if (j.authenticated && j.user) setUser({ username: j.user.username, role: j.user.role })
      } catch {}
    }
    loadUser()
    const loadNotifs = async () => {
      try {
        const r = await fetch("/api/notifications", { credentials: "include" })
        const j = await r.json()
        setUnread(j.unread ?? 0)
      } catch {}
    }
    loadNotifs()
    const id = setInterval(loadNotifs, 15000)
    return () => clearInterval(id)
  }, [])

  if (!user) {
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
              const isFriends = it.href === "/friends"
              return (
                <Link key={it.href} href={it.href} title={(it as any).hint} className="relative flex items-center gap-2 rounded-full px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white transition">
                  <Icon className="h-4 w-4" /> {it.label}
                  {isFriends && unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">{unread}</span>}
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
          <Link href="/friends" className="relative hidden sm:flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-700">
            <Bell className="h-3 w-3" /> {unread > 0 ? `${unread} bildirim` : "Bildirim"}
            {unread > 0 && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
          </Link>
          <span className="hidden sm:flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-white" /> {user.username}
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-black">{isAdmin ? "ADMIN" : "USER"}</span>
          </span>
          <button
            onClick={async () => {
              await fetch("/api/auth/signout", { method:"POST", credentials:"include"})
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
                  title={(it as any).hint}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm text-zinc-300 hover:bg-zinc-900"
                >
                  <Icon className="h-4 w-4" /> {it.label}
                  {it.href === "/friends" && unread > 0 && <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">{unread}</span>}
                </Link>
              )
            })}
            {isAdmin && (
              <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm text-zinc-300 hover:bg-zinc-900">
                <Shield className="h-4 w-4" /> Yönetim
              </Link>
            )}
            <button
              onClick={async () => {
                await fetch("/api/auth/signout", { method:"POST", credentials:"include"})
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
