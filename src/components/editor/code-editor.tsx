"use client"
import { useState } from "react"
import { Play, Save, Copy, Download, Sparkles, PanelRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/ui/code-block"

export function CodeEditor({ initialCode = "// Agent kod editörü — AI burada yazar\nconsole.log('Merhaba Sucuk-Agent')", language="javascript" }: { initialCode?: string, language?: string }) {
  const [code, setCode] = useState(initialCode)
  const [output, setOutput] = useState("")
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiLoading, setAiLoading] = useState(false)

  const run = () => {
    try{
      const fn = new Function(code + "\nreturn typeof result !== 'undefined' ? result : 'Çalıştırıldı';")
      const logs: string[] = []
      const oldLog = console.log
      console.log = (...args:any[])=> logs.push(args.join(" "))
      const res = fn()
      console.log = oldLog
      setOutput(logs.join("\n") + (res ? "\n→ " + String(res) : ""))
    }catch(e:any){
      setOutput("Hata: " + e.message)
    }
  }

  const askAI = async () => {
    if(!aiPrompt.trim()) return
    setAiLoading(true)
    try{
      const chatRes = await fetch("/api/orchestrator", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ task: aiPrompt, language }), credentials:"include"})
      if(chatRes.ok){
        const j = await chatRes.json()
        setCode(j.code || j.result || code)
      }
    }catch{}
    setAiLoading(false)
  }

  const saveToDrive = async () => {
    const blob = new Blob([code], { type:"text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href=url; a.download=`agent-code-${Date.now()}.js`; a.click()
    URL.revokeObjectURL(url)
    await fetch("/api/drive", { credentials:"include"})
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium flex items-center gap-2"><Sparkles className="h-4 w-4 text-[var(--coral)]"/> AI Kod Editörü <span className="rounded-full bg-[var(--ink)] text-[var(--canvas)] px-2 py-0.5 text-[10px] font-bold">{language}</span></h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={saveToDrive} className="rounded-full border-[var(--hairline)] bg-[var(--surface)]"><Save className="h-4 w-4"/> Kaydet</Button>
            <Button size="sm" onClick={run} className="btn-coral h-8"><Play className="h-4 w-4"/> Çalıştır</Button>
          </div>
        </div>
        <textarea value={code} onChange={e=>setCode(e.target.value)} className="w-full h-[420px] font-mono text-[13px] leading-[1.6] bg-[var(--ink)] text-[var(--canvas)] border border-[var(--hairline)] rounded-[12px] p-4 focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/20 focus:border-[var(--coral)]" spellCheck={false}/>
        <div className="flex gap-2">
          <input value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} placeholder="AI’ye sor: Örn. Ürün kartı için Tailwind grid yaz" className="flex-1 rounded-full border border-[var(--hairline)] bg-[var(--surface)] px-4 py-2.5 text-sm placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--coral)]"/>
          <Button onClick={askAI} disabled={aiLoading} className="btn-coral rounded-full">{aiLoading?"Yazıyor…":"AI Yazsın"}</Button>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] tracking-[0.12em] font-semibold text-[var(--muted)] flex items-center gap-2"><PanelRight className="h-3 w-3"/> ÇIKTI / ARTIFACT</p>
          <div className="flex gap-1">
            <button onClick={async()=>{ await navigator.clipboard.writeText(code)}} className="p-2 rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] hover:bg-[var(--surface-cream)]"><Copy className="h-3 w-3"/></button>
            <button onClick={saveToDrive} className="p-2 rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] hover:bg-[var(--surface-cream)]"><Download className="h-3 w-3"/></button>
          </div>
        </div>
        <div className="h-[420px] rounded-[12px] border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden flex flex-col">
          <div className="flex-1 p-4 overflow-auto font-mono text-sm whitespace-pre-wrap bg-[var(--canvas-soft)] text-[var(--ink)] border-b border-[var(--hairline)]">
            {output || "Çıktı burada görünecek — Run’a bas."}
          </div>
          <div className="p-3 bg-[var(--surface)]">
            <CodeBlock code={code} language={language} prompt={aiPrompt}/>
          </div>
        </div>
      </div>
    </div>
  )
}
