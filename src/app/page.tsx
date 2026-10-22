import Link from "next/link";
import {
  Bot,
  Zap,
  Image as ImageIcon,
  Search,
  Shield,
  Users,
  MessageCircle,
  Code2,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  const features = [
    {
      icon: Bot,
      title: "Orkestratör Yönlendirici",
      desc: "Gelen isteği analiz eder ve görevin türüne göre uygun alt modele/ajanı yönlendirir.",
    },
    {
      icon: Code2,
      title: "Çoklu API Sağlayıcısı",
      desc: "Google Gemini, OpenAI, Groq, Grok, OpenRouter, DeepSeek, Kimi, Nvidia ve Hugging Face desteği.",
    },
    {
      icon: Zap,
      title: "Anahtar Döndürme",
      desc: "Her sağlayıcıdan 3'er anahtar; kotası biten anahtarda otomatik diğerine geçiş.",
    },
    {
      icon: ImageIcon,
      title: "Görsel Üretimi",
      desc: "Hugging Face ile metinden görsel üretim ve alternatif model desteği.",
    },
    {
      icon: Search,
      title: "Web Arama & Gezinme",
      desc: "Canlı web araması ve belirtilen URL'lerden içerik okuma işleme.",
    },
    {
      icon: Brain,
      title: "Derin Düşünme",
      desc: "Karmaşık problemleri adım adım analiz eden reasoning modu.",
    },
  ];

  const providers = [
    "Google Gemini",
    "OpenAI",
    "Groq",
    "Grok (xAI)",
    "OpenRouter",
    "DeepSeek",
    "KIMI",
    "Nvidia",
    "Hugging Face",
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sucuk-600 text-white text-sm font-bold">S</span>
            Sucuk<span className="text-sucuk-600">Agent</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/dashboard" className="hover:text-sucuk-600 transition">Sohbetler</Link>
            <Link href="/friends" className="hover:text-sucuk-600 transition">Arkadaşlar</Link>
            <Link href="/settings" className="hover:text-sucuk-600 transition">Ayarlar</Link>
            <Link href="/login" className="px-4 py-2 rounded-md bg-sucuk-600 text-white hover:bg-sucuk-500 transition">Giriş Yap</Link>
          </div>
        </div>
      </nav>

      <header className="py-12 px-6 text-center bg-slate-50 border-b border-slate-200">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 text-balance">
          Üst Düzey Yapay Zekâ Agent Sistemi
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          Orchestrator yönlendirici, çoklu API sağlayıcısı, anahtar döndürme ve
          düz sohbet modu destekli uçtan uca AI agent platformu.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login" className="px-8 py-3 bg-sucuk-600 text-white rounded-xl text-lg font-semibold hover:bg-sucuk-500 transition shadow-lg">
            Hesapla Giriş Yap
          </Link>
          <Link href="#features" className="px-8 py-3 border border-slate-200 rounded-xl text-lg font-semibold text-slate-700 hover:bg-slate-100 transition">
            Özellikler
          </Link>
        </div>
      </header>

      <section id="features" className="py-16 px-6">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-2">Mimari Özellikler</h2>
        <p className="text-center text-slate-500 mb-12">Requirement mimarisiyle geliştirilmiş, modüler ve ölçeklenebilir</p>
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Card key={i} className="hover:shadow-xl transition border-slate-100">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sucuk-100 text-sucuk-600 mb-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>{f.desc}</CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="py-16 px-6 bg-slate-100 border-t border-slate-200">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-2">API Sağlayıcıları</h2>
        <p className="text-center text-slate-500 mb-10">Her sağlayıcıdan 3'er API anahtarı, otomatik kota döndürmesi</p>
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-3">
          {providers.map((p, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              {p}
            </div>
          ))}
        </div>
      </section>

      <footer className="py-10 px-6 border-t border-slate-200 bg-white text-center text-sm text-slate-500">
        Sucuk-Agent • Yönetici: Sucuk9977 • Kullanıcı: Pirensine •
        Veritabanı: Supabase • Barındırma: Vercel • Google Drive yedekleme
      </footer>
    </div>
  );
}
