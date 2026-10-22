"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bot,
  Shield,
  User,
  MessageCircle,
  Image,
  Search,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  BarChart3,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Sohbetler", icon: MessageCircle },
  { href: "/friends", label: "Arkadaşlar", icon: Users },
  { href: "/settings", label: "Ayarlar", icon: Settings },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);

  useEffect(() => {
    const u = getCurrentUser();
    setUser(u ? { username: u.username, role: u.role } : null);
  }, []);

  if (!user) return null;

  const isAdmin = user.role === "admin";

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sucuk-600 text-white text-sm font-bold">
            S
          </div>
          <Link href="/dashboard" className="ml-2 text-xl font-bold tracking-tight text-slate-900">
            Sucuk<span className="text-sucuk-600">Agent</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-sucuk-600 transition"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-sucuk-600 transition"
            >
              <Shield className="h-4 w-4" />
              Yönetim
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-slate-500">{user.username}</span>
          <span className="hidden sm:block text-xs px-2 py-1 rounded border border-slate-200 text-slate-600 bg-white">
            {user.role === "admin" ? "Yönetici" : "Kullanıcı"}
          </span>
          <button
            onClick={() => {
              document.cookie = "sucuk_session=; Path=/; Max-Age=0";
              window.location.href = "/login";
            }}
            className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" /> Çıkış
          </button>
        </div>

        <button
          className="md:hidden p-2 text-slate-600 hover:text-sucuk-600"
          onClick={() => setOpen((o) => !o)}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="grid gap-1 px-6 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-3 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-sucuk-600"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-3 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-sucuk-600"
              >
                <Shield className="h-4 w-4" />
                Yönetim
              </Link>
            )}
            <button
              onClick={() => {
                document.cookie = "sucuk_session=; Path=/; Max-Age=0";
                window.location.href = "/login";
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-3 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" /> Çıkış
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
