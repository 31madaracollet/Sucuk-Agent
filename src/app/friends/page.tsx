"use client"
import Link from "next/link"
export default function FriendsPage(){
  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="rounded-[16px] border border-[var(--hairline)] bg-[var(--surface)] p-8 text-center">
        <h1 className="font-display text-[22px] text-[var(--ink)]">Rehber / DM Kaldırıldı</h1>
        <p className="text-sm text-[var(--muted)] mt-2">Bu proje artık sadece <b>AI sohbetlerine</b> odaklanıyor. DM ve Rehber özelliği tamamen kaldırıldı.</p>
        <p className="text-xs text-[var(--muted)] mt-1">Her kullanıcı sadece kendi AI sohbetlerini görür, sohbetler birbirine karışmaz.</p>
        <div className="mt-6 flex gap-2 justify-center">
          <Link href="/dashboard" className="rounded-full bg-[var(--ink)] text-[var(--canvas)] px-5 py-2.5 text-sm font-medium">Asistan&apos;a Git →</Link>
          <Link href="/editor" className="rounded-full border border-[var(--hairline)] bg-[var(--canvas)] px-5 py-2.5 text-sm">Editör</Link>
        </div>
      </div>
    </div>
  )
}
