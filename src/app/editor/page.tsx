"use client"
import { CodeEditor } from "@/components/editor/code-editor"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { Sparkles, Layers, Github, Cloud } from "lucide-react"

export default function EditorPage(){
  return (
    <>
      <Navbar/>
      <div className="flex">
        <Sidebar/>
        <div className="flex-1 min-w-0 bg-[var(--canvas)]">
          <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-8 space-y-6">
            <div>
              <h1 className="font-display text-[28px] tracking-[-0.6px] flex items-center gap-2"><Sparkles className="h-5 w-5 text-[var(--coral)]"/> Yerleşik Kod Editörü</h1>
              <p className="text-sm text-[var(--muted)] mt-1">AI burada kod yazar, düzenler, test eder — artifact sağda, GitHub/Vercel’e push hazır</p>
            </div>

            <div className="card-claude p-2 overflow-hidden">
              <CodeEditor
                initialCode={`// Sucuk-Agent — Claude artifact örneği
// Satış sitesi + FLUX görsel
import React from 'react'
const products = [
  { id: 1, name: 'Sucuk Ekmek', price: 129, image: '/sucuk.jpg' },
  { id: 2, name: 'Ayran', price: 45, image: '/ayran.jpg' },
]

export default function Shop(){
  return (
    <div className="grid grid-cols-3 gap-4 p-6 bg-[#faf9f5]">
      {products.map(p=> (
        <div key={p.id} className="rounded-[16px] border border-[#e6dfd8] bg-white p-4">
          <img src={p.image} alt={p.name} className="rounded-[12px] w-full h-32 object-cover" />
          <h3 className="font-medium mt-3">{p.name} — {p.price}₺</h3>
          <button className="mt-2 w-full rounded-[8px] bg-[#cc785c] text-white py-2 text-sm">Sepete ekle</button>
        </div>
      ))}
    </div>
  )
}`}
                language="tsx"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="card-claude p-5">
                <Layers className="h-5 w-5 text-[var(--coral)] mb-2"/>
                <p className="text-sm font-medium">Orchestration</p>
                <p className="text-xs text-[var(--muted)] mt-1">Satış sitesi → Planner (Groq 120B) → Görsel (FLUX) → Kod (DeepSeek) → GitHub → Vercel. <code className="font-mono">/api/orchestrator</code></p>
              </div>
              <div className="card-claude p-5">
                <Github className="h-5 w-5 text-[var(--coral)] mb-2"/>
                <p className="text-sm font-medium">GitHub push</p>
                <p className="text-xs text-[var(--muted)] mt-1">Kod artifact’ten tek tıkla repo’ya. Editör + Drive yedek senkron.</p>
              </div>
              <div className="card-claude p-5">
                <Cloud className="h-5 w-5 text-[var(--coral)] mb-2"/>
                <p className="text-sm font-medium">Supabase + Drive</p>
                <p className="text-xs text-[var(--muted)] mt-1">Her kaydetme Supabase’e yazılır, Drive’a oto-yedeklenir. 1 hafta kuralı.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
