import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SessionProvider } from "@/components/session-provider"

export const metadata: Metadata = {
  title: "Sucuk-Agent — Düşünen Partner (Claude Editorial × Cihaz Gece)",
  description: "Warm parchment gündüz, OLED cihaz gece. Orchestrator beleş modellere öncelik verir — kod→GPT-OSS 120B, görsel→FLUX, akıl→Reasoner. Supabase + Drive, arkadaşlar DM, Google oto-bağlama, artifact split.",
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover" as const,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="min-h-full bg-[var(--bg)] text-[var(--fg)] antialiased selection:bg-[#cc785c]/20">
        <SessionProvider><ThemeProvider>{children}</ThemeProvider></SessionProvider>
      </body>
    </html>
  )
}
