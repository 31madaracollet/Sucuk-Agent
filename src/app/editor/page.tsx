"use client"
import { CodeEditor } from "@/components/editor/code-editor"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"

export default function EditorPage(){
  return (
    <>
      <Navbar/>
      <div className="flex">
        <Sidebar/>
        <div className="flex-1 p-4 md:p-6">
          <div className="max-w-6xl mx-auto space-y-4">
            <div>
              <h1 className="text-2xl font-semibold text-white">Yerleşik Kod Editörü</h1>
              <p className="text-sm text-zinc-500">AI burada kod yazar, düzenler, test eder — GitHub/Vercel'e push hazır</p>
            </div>
            <CodeEditor initialCode={`// Sucuk-Agent Satış Sitesi Örneği\nimport React from 'react'\nconst products = [{id:1,name:'Sucuk Ekmek',price:129,image:'/sucuk.jpg'}]\nexport default function Shop(){\n  return (\n    <div className="grid grid-cols-3 gap-4">\n      {products.map(p=>(\n        <div key={p.id} className="border rounded-xl p-4">\n          <img src={p.image} alt={p.name} className="rounded"/>\n          <h3>{p.name} — {p.price}₺</h3>\n        </div>\n      ))}\n    </div>\n  )\n}`} language="tsx" />
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-xs text-zinc-400">
              <p><b>Orchestration:</b> Satış sitesi istendiğinde → <i>Planner (Groq 120B)</i> → <i>Görsel (FLUX)</i> → <i>Kod (DeepSeek/Google/OpenAI)</i> → <i>Metin (Groq/Kimi)</i> → <i>GitHub push</i> → <i>Vercel publish</i> + Supabase tablolar.</p>
              <p className="mt-1">Detay: <code>/api/orchestrator</code> planComplexTask ile yönetilir.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
