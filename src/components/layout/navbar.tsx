"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Bot, Shield, Users, MessageCircle, Settings, LogOut, Menu, X, Bell, Code2, Layers, Sun, Moon } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

// Claude: nav SOLA yaslı, text-only, 14px/500, center değil — NNGroup %69 sola bakar
const navItems = [
  { href: "/dashboard", label: "Sohbet", icon: MessageCircle },
  { href: "/friends", label: "Arkadaşlar", icon: Users },
  { href: "/editor", label: "Kod", icon: Code2 },
  { href: "/workspace", label: "Workspace", icon: Layers },
  { href: "/settings", label: "Ayarlar", icon: Settings },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<{ username: string; role: string } | null>(null)
  const [unread, setUnread] = useState(0)
  const { theme, toggle } = useTheme()

  useEffect(() => {
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

  // misafir nav — editorial, Claude paper
  if (!user) {
    return (
      <nav className="sticky top-0 z-40 border-b border-[var(--hairline)] bg-[var(--canvas)]/90 backdrop-blur">
        <div className="mx-auto max-w-[1600px] flex items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--ink)] text-[var(--canvas)]">
              <Bot className="h-4 w-4" />
            </span>
            <span className="font-display text-[18px] tracking-tight text-[var(--ink)]">Sucuk<span className="font-light opacity-60">Agent</span></span>
            <span className="hidden sm:inline rounded-full border border-[var(--hairline)] bg-[var(--surface)] px-2.5 py-1 text-[10px] tracking-widest text-[var(--muted)]">CLAUDE × CİHAZ</span>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={()=>toggle(theme==="light"?"dark":"light")} className="p-2 rounded-full border border-[var(--hairline)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]">
              {theme==="light" ? <Moon className="h-4 w-4"/> : <Sun className="h-4 w-4"/>}
            </button>
            <Link href="/login" className="btn-coral">Giriş Yap</Link>
          </div>
        </div>
      </nav>
    )
  }

  const isAdmin = user.role === "admin"

  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--hairline)] bg-[var(--canvas)]/90 backdrop-blur">
      <div className="mx-auto max-w-[1600px] flex items-center justify-between px-6 h-[64px]">
        {/* SOLA YASLI NAV — Claude kuralı */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--ink)] text-[var(--canvas)]">
              <Bot className="h-4 w-4" />
            </span>
            <span className="font-display text-[18px] tracking-tight text-[var(--ink)]">Sucuk<span className="font-light opacity-60">Agent</span></span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((it) => {
              const Icon = it.icon
              const isFriends = it.href === "/friends"
              return (
                <Link key={it.href} href={it.href} className="relative flex items-center gap-2 rounded-[8px] px-3 py-2 text-[14px] font-[500] text-[var(--muted)] hover:bg-[var(--surface-cream)] hover:text-[var(--ink)] transition">
                  <Icon className="h-4 w-4" /> {it.label}
                  {isFriends && unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--coral)] text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
                </Link>
              )
            })}
            {isAdmin && (
              <Link href="/admin" className="flex items-center gap-2 rounded-[8px] px-3 py-2 text-[14px] font-[500] text-[var(--muted)] hover:bg-[var(--surface-cream)] hover:text-[var(--ink)]">
                <Shield className="h-4 w-4" /> Yönetim
              </Link>
            )}
          </div>
        </div>

        {/* SAĞ CLUSTER */}
        <div className="flex items-center gap-2">
          <button onClick={()=>toggle(theme==="light"?"dark":"light")} className="hidden sm:flex p-2 rounded-full border border-[var(--hairline)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)] transition" title="Tema değiştir">
            {theme==="light" ? <Moon className="h-4 w-4"/> : <Sun className="h-4 w-4"/>}
          </button>

          <Link href="/friends" className="relative hidden md:flex items-center gap-2 rounded-full border border-[var(--hairline)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--muted)] hover:border-[var(--hairline)] hover:text-[var(--ink)]">
            <Bell className="h-3.5 w-3.5" /> {unread > 0 ? `${unread} yeni` : "Bildirim"}
            {unread > 0 && <span className="h-2 w-2 rounded-full bg-[var(--coral)]" />}
          </Link>

          <span className="hidden sm:flex items-center gap-2 rounded-full border border-[var(--hairline)] bg-[var(--surface)] pl-2 pr-1 py-1 text-xs">
            <span className="h-6 w-6 rounded-full bg-[var(--ink)] text-[var(--canvas)] grid place-items-center text-[10px] font-bold">{user.username[0]?.toUpperCase()}</span>
            <span className="text-[var(--ink)] font-medium hidden xl:inline">{user.username}</span>
            <span className="rounded-full bg-[var(--coral)] px-2 py-0.5 text-[10px] font-bold text-white">{isAdmin ? "ADMIN" : "USER"}</span>
          </span>

          <button onClick={async () => { await fetch("/api/auth/signout", { method:"POST", credentials:"include"}); window.location.href="/login" }} className="hidden sm:flex items-center gap-2 rounded-[8px] border border-[var(--hairline)] bg-transparent px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--ink)] hover:text-[var(--canvas)] transition">
            <LogOut className="h-4 w-4" /> Çıkış
          </button>

          <button className="lg:hidden p-2 rounded-[8px] bg-[var(--surface)] border border-[var(--hairline)] text-[var(--muted)]" onClick={() => setOpen(o=>!o)}>
            {open ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-[var(--hairline)] bg-[var(--canvas)]">
          <div className="px-4 py-3 grid gap-1">
            {navItems.map(it=>{
              const Icon=it.icon
              return (
                <Link key={it.href} href={it.href} onClick={()=>setOpen(false)} className="flex items-center gap-3 rounded-[8px] px-3 py-3 text-sm font-medium text-[var(--ink)] hover:bg-[var(--surface-cream)]">
                  <Icon className="h-4 w-4"/> {it.label}
                  {it.href==="/friends" && unread>0 && <span className="ml-auto rounded-full bg-[var(--coral)] px-2 py-0.5 text-xs text-white">{unread}</span>}
                </Link>
              )
            })}
            {isAdmin && <Link href="/admin" onClick={()=>setOpen(false)} className="flex items-center gap-3 rounded-[8px] px-3 py-3 text-sm text-[var(--ink)] hover:bg-[var(--surface-cream)]"><Shield className="h-4 w-4"/> Yönetim</Link>}
            <button onClick={async()=>{await fetch("/api/auth/signout",{method:"POST",credentials:"include"}); window.location.href="/login"}} className="flex items-center gap-3 rounded-[8px] px-3 py-3 text-sm text-[var(--error)] hover:bg-[var(--surface-cream)]"><LogOut className="h-4 w-4"/> Çıkış</button>
            <button onClick={()=>toggle(theme==="light"?"dark":"light")} className="flex items-center gap-3 rounded-[8px] px-3 py-3 text-sm text-[var(--muted)] hover:bg-[var(--surface-cream)]">{theme==="light"?<Moon className="h-4 w-4"/>:<Sun className="h-4 w-4"/>} {theme==="light"?"Karanlık mod":"Aydınlık mod"}</button>
          </div>
        </div>
      )}
    </nav>
  )
}
