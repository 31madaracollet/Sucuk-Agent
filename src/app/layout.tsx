import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Sucuk-Agent — Siyah/Beyaz Cihaz",
  description: "Orchestrator'lı, beleş modellere öncelik veren siyah-beyaz premium AI agent. Supabase + Drive yedek, arkadaşlar, Düz/Agent mod.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="h-full dark">
      <body className="min-h-full bg-zinc-950 text-zinc-100 antialiased selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  )
}
