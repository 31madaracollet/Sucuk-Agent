import Link from "next/link"
import { Bot, Sparkles, Cpu, Layers, BookOpen, Feather, ArrowRight, Check } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--canvas)] text-[var(--ink)]">
      {/* Top bar — Claude cream */}
      <nav className="sticky top-0 z-20 border-b border-[var(--hairline)] bg-[var(--canvas)]/80 backdrop-blur">
        <div className="mx-auto max-w-[1200px] px-6 h-[64px] flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--ink)] text-[var(--canvas)]"><Bot className="h-4 w-4" /></span>
            <span className="font-display text-[18px] tracking-tight">Sucuk<span className="font-light opacity-60">Agent</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-[14px] font-[500] text-[var(--muted)]">
            <a href="#artifacts" className="hover:text-[var(--ink)]">Artifacts</a>
            <a href="#providers" className="hover:text-[var(--ink)]">Modeller</a>
            <Link href="/login" className="btn-coral">Giriş Yap</Link>
          </div>
          <Link href="/login" className="md:hidden btn-coral px-4">Giriş</Link>
        </div>
      </nav>

      {/* Hero — editorial, Claude style */}
      <header className="border-b border-[var(--hairline)] bg-[var(--canvas)] px-6 pt-16 pb-20">
        <div className="mx-auto max-w-[900px] text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[var(--hairline)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--muted)]">
            <Sparkles className="h-3 w-3 text-[var(--coral)]" /> Claude editorial × Siyah cihaz — warm paper gündüz, OLED gece
          </div>
          <h1 className="font-display text-[42px] md:text-[64px] font-[400] tracking-[-1.5px] leading-[1.05] mt-6 text-balance">
            Düşünen partnerin.<br />
            <span className="italic font-[400] text-[var(--coral)]">Köpek çiz</span> de, kod yaz de — cihaz anlar.
          </h1>
          <p className="mx-auto mt-6 max-w-[640px] text-[18px] leading-[1.6] text-[var(--ink-soft)]">
            Orchestrator mesajını göreve ayırır: kod → <span className="font-medium text-[var(--ink)]">GPT-OSS 120B</span>, görsel → <span className="font-medium text-[var(--ink)]">FLUX.1</span>, akıl → <span className="font-medium text-[var(--ink)]">Reasoner</span>. Kota bitince sessizce beleş yedeğe geçer.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="btn-coral h-[44px] px-8 text-[15px] inline-flex items-center justify-center gap-2">Hesapla Giriş Yap <ArrowRight className="h-4 w-4" /></Link>
            <Link href="#artifacts" className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] px-8 py-3 text-[14px] font-[500] text-[var(--ink)] hover:bg-[var(--surface-cream)]">Artifacts’i gör</Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <span className="rounded-full border border-[var(--hairline)] bg-[var(--surface)] px-3 py-1.5 text-xs flex items-center gap-2"><Cpu className="h-3 w-3" /> köpek çiz → FLUX</span>
            <span className="rounded-full border border-[var(--hairline)] bg-[var(--surface)] px-3 py-1.5 text-xs flex items-center gap-2"><Feather className="h-3 w-3" /> kod → GPT-OSS 120B</span>
            <span className="rounded-full border border-[var(--hairline)] bg-[var(--surface)] px-3 py-1.5 text-xs flex items-center gap-2"><Layers className="h-3 w-3" /> Supabase + Drive oto-yedek</span>
          </div>
        </div>

        {/* Mock artifact split — signature */}
        <div className="mx-auto mt-14 max-w-[1100px] grid md:grid-cols-[1.1fr_0.9fr] gap-4">
          <div className="rounded-[16px] border border-[var(--hairline-soft)] bg-[var(--surface)] p-6 text-left">
            <p className="text-[10px] tracking-[0.12em] font-semibold text-[var(--muted)]">SOHBET</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-[12px] bg-[var(--ink)] text-[var(--canvas)] px-4 py-3 text-sm max-w-[80%] ml-auto">Uzay temalı bir köpek çiz, poster gibi olsun</div>
              <div className="rounded-[12px] border border-[var(--hairline)] bg-[var(--canvas-soft)] px-4 py-3 text-sm max-w-[85%]">Harika — FLUX.1 ile oluşturuyorum. Sağda artifact’te gör.</div>
            </div>
            <p className="mt-4 text-xs text-[var(--muted)]">Agent: görsel→FLUX.1, kod→GPT-OSS 120B, akıl→Reasoner</p>
          </div>
          <div className="rounded-[16px] border border-[var(--hairline)] bg-[var(--ink)] text-[var(--canvas)] p-6">
            <p className="text-[10px] tracking-[0.12em] font-semibold opacity-60">ARTIFACT — GÖRSEL</p>
            <div className="mt-4 rounded-[12px] bg-[#1a1a19] border border-white/10 p-6 text-center">
              <div className="h-24 rounded-[8px] bg-gradient-to-br from-[#cc785c]/30 to-[#faf9f5]/10 grid place-items-center text-xs">FLUX.1 Schnell • poster</div>
              <p className="mt-3 text-xs opacity-70">Kod/ görsel burada canlı render edilir — sohbet sol, eser sağ.</p>
            </div>
            <div className="mt-4 flex gap-2">
              <span className="rounded-full bg-white text-black px-3 py-1 text-xs font-medium">Kopyala</span>
              <span className="rounded-full border border-white/20 px-3 py-1 text-xs">PDF indir</span>
            </div>
          </div>
        </div>
      </header>

      {/* Features — 3 sütun, Claude card */}
      <section id="artifacts" className="px-6 py-16 bg-[var(--canvas)]">
        <div className="mx-auto max-w-[1100px]">
          <h2 className="font-display text-[32px] tracking-[-0.5px] text-center">Sohbet sol, eser sağ</h2>
          <p className="text-center text-[var(--muted)] mt-2">Claude’un Haziran 2024 imzası — artık Sucuk’ta</p>
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {[
              { icon: BookOpen, title: "Warm editorial", desc: "Parchment #faf9f5 zemin, Cormorant serif başlık, Inter metin. Gündüz kağıt, gece cihaz." },
              { icon: Layers, title: "Artifact split", desc: "Kod/görsel sohbette değil, sağ panelde canlı. Tek tıkla kopyala, PDF, önizle." },
              { icon: Cpu, title: "Beleş orchestrator", desc: "Her mesaj bir göreve: GPT-OSS, Gemini, FLUX, Reasoner, Groq — kota bitince yedek." },
            ].map((f, i)=>{ const Icon=f.icon; return (
              <div key={i} className="card-claude p-6">
                <div className="h-10 w-10 rounded-[10px] bg-[var(--ink)] text-[var(--canvas)] grid place-items-center mb-4"><Icon className="h-5 w-5"/></div>
                <h3 className="font-medium text-[var(--ink)]">{f.title}</h3>
                <p className="mt-2 text-sm leading-[1.6] text-[var(--muted)]">{f.desc}</p>
              </div>
            )})}
          </div>
        </div>
      </section>

      {/* Providers */}
      <section id="providers" className="px-6 py-12 border-y border-[var(--hairline)] bg-[var(--surface-cream)]/50">
        <div className="mx-auto max-w-[900px]">
          <h3 className="font-display text-[22px] text-center">Her beleş modele bir görev</h3>
          <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            {[
              ["Genel", "GPT-OSS 20B • Gemini 3.8 • Qwen 2.5"],
              ["Kod", "GPT-OSS 120B • Claude Sonnet 5.5"],
              ["Görsel", "FLUX.1 Schnell • SDXL"],
              ["Akıl", "DeepSeek Reasoner • Nemotron"],
              ["Arama", "Groq + DuckDuckGo"],
              ["Ses", "Groq Whisper STT"],
            ].map(([k,v])=>(
              <div key={k} className="flex items-center justify-between rounded-[12px] border border-[var(--hairline)] bg-[var(--surface)] px-4 py-3">
                <span className="font-medium text-[var(--ink)]">{k}</span>
                <span className="text-xs text-[var(--muted)]">{v}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-[var(--muted)] flex items-center justify-center gap-2"><Check className="h-3 w-3 text-[var(--success)]"/> Supabase + Drive oto-yedek • Google hesabı agent’a oto-bağlanır • Arkadaşlar DM yan panelde</p>
        </div>
      </section>

      <footer className="border-t border-[var(--hairline)] bg-[var(--canvas)] px-6 py-8 text-center text-xs text-[var(--muted)]">
        Sucuk-Agent • Editorial gündüz, cihaz gece • Yönetici: Sucuk9977 • Kullanıcı: Pirensine • Supabase + Vercel + Drive
      </footer>
    </div>
  )
}
