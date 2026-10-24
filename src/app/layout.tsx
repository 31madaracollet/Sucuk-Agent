import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "Sucuk-Agent — Siyah/Beyaz Cihaz",
  description: "Orchestrator'lı, beleş modellere öncelik veren siyah-beyaz premium AI agent. Supabase + Drive yedek, arkadaşlar, editör, PDF, tema.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="h-full dark">
      <body className="min-h-full bg-zinc-950 text-zinc-100 antialiased selection:bg-white selection:text-black">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
