import Link from "next/link"
import { Bot, Zap, Image as ImageIcon, Search, Shield, Users, MessageCircle, Code2, Brain, Sparkles, Cpu, HardDrive } from "lucide-react"

export default function LandingPage() {
  const features = [
    { icon: Bot, title: "Agent Orchestrator", desc: "Mesajı analiz eder: köpek çiz→FLUX, kod→GPT-OSS 120B, akıl→Reasoner. Beleşe öncelik." },
    { icon: Code2, title: "Tüm Beleş Modeller", desc: "Groq GPT-OSS 20B/120B, Gemini 3.8, Qwen 2.5, Claude Sonnet 5.5 — her birine görev verildi." },
    { icon: Zap, title: "Anahtar Döndürme", desc: "Her sağlayıcı x3 anahtar. Kota bitince otomatik yedeğe geçer, düz moda düşmezse akış bozulmaz." },
    { icon: ImageIcon, title: "Görsel Cihaz", desc: "HuggingFace FLUX.1 Schnell + SDXL. 'köpek çiz' deyince direkt görsel." },
    { icon: Search, title: "Web Arama + Drive", desc: "DuckDuckGo canlı arama, URL gezinme, sohbetler Supabase'te, Drive'a tek tık yedek." },
    { icon: Brain, title: "Siyah/Beyaz Premium", desc: "Cihaz teması — OLED siyah, beyaz kontrast, pürüzsüz akış, normal AI gibi." },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <nav className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black"><Bot className="h-5 w-5" /></span>
            <span className="text-lg font-semibold tracking-tight">Sucuk<span className="font-light text-zinc-400">Agent</span></span>
            <span className="hidden sm:inline rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[10px] tracking-widest text-zinc-400">SİYAH • BEYAZ • CİHAZ</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
            <Link href="/dashboard" className="hover:text-white">Sohbetler</Link>
            <Link href="/friends" className="hover:text-white">Arkadaşlar</Link>
            <Link href="/settings" className="hover:text-white">Ayarlar</Link>
            <Link href="/login" className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200">Giriş Yap</Link>
          </div>
        </div>
      </nav>

      <header className="border-b border-zinc-800 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 to-zinc-950 px-6 py-16 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="mx-auto mb-4 flex items-center justify-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400 w-fit">
            <Sparkles className="h-3 w-3" /> Agent artık AI seçer • Beleş modellere öncelik
          </div>
          <h1 className="text-balance text-4xl md:text-6xl font-semibold tracking-tight">
            Köpek çiz de, kod yaz de — <span className="bg-white text-black px-2 rounded-lg">cihaz anlar</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
            Orchestrator her mesajı bir göreve atar ve en iyi beleş modeli seçer. Kota bitince sessizce yedeğe geçer. Sohbetler Supabase'te, dostlarınla DM, Drive yedek — hepsi siyah-beyaz premium akış.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="rounded-full bg-white px-8 py-3 text-base font-semibold text-black hover:bg-zinc-200">Hesapla Giriş Yap</Link>
            <Link href="#features" className="rounded-full border border-zinc-800 bg-zinc-900 px-8 py-3 text-base font-medium text-zinc-200 hover:bg-zinc-800">Özellikler</Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-2 text-xs text-zinc-500">
            <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 flex items-center gap-1"><Cpu className="h-3 w-3" /> Agent: köpek çiz → FLUX</span>
            <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 flex items-center gap-1"><Code2 className="h-3 w-3" /> Kod → GPT-OSS 120B (beleş)</span>
            <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 flex items-center gap-1"><HardDrive className="h-3 w-3" /> Supabase + Drive</span>
          </div>
        </div>
      </header>

      <section id="features" className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight">Siyah-beyaz cihaz gibi</h2>
          <p className="text-center text-sm text-zinc-500 mt-1">Normal AI akıcılığında, her beleş modele bir görev</p>
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-700 transition">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black mb-3"><Icon className="h-5 w-5" /></div>
                  <h3 className="font-medium text-white">{f.title}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-800 bg-zinc-900/50 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <h3 className="text-center text-lg font-semibold">Beleş modellere görev dağılımı</h3>
          <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            {[
              ["Genel", "GPT-OSS 20B • Gemini 3.8 • Qwen 2.5"],
              ["Kod", "GPT-OSS 120B • Claude Sonnet 5.5 • Qwen Coder"],
              ["Görsel", "FLUX.1 Schnell • SDXL (HF)"],
              ["Akıl", "DeepSeek Reasoner • Nemotron 49B"],
              ["Arama", "Groq + DuckDuckGo • Llama 3.3 Free"],
              ["Çeviri/Özet", "Gemini 3.8 Lite • Moonshot 8K"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
                <span className="font-medium text-zinc-200">{k}</span>
                <span className="text-zinc-500 text-xs">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-800 bg-zinc-950 px-6 py-8 text-center text-xs text-zinc-500">
        Sucuk-Agent • Siyah/Beyaz Cihaz • Yönetici: Sucuk9977 / SigmaAkif2013 • Kullanıcı: Pirensine / 2.0.2.7.F.Z.3102 • Supabase + Vercel + Drive yedek
      </footer>
    </div>
  )
}
