import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sucuk-Agent | Yapay Zekâ Agent Platformu",
  description: "Çoklu API sağlayıcılı, orchestrator destekli yapay zekâ agent sistemi.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="h-full">
      <body className="font-sans antialiased text-slate-900 bg-slate-50 min-h-full">
        {children}
      </body>
    </html>
  );
}
