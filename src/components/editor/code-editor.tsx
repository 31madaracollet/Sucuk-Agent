"use client"
import { useState, useEffect } from "react"
import { Play, Save, Copy, Download, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/ui/code-block"

export function CodeEditor({ initialCode = "// Agent kod editörü — AI burada yazar\nconsole.log('Merhaba Sucuk-Agent')", language="javascript" }: { initialCode?: string, language?: string }) {
  const [code, setCode] = useState(initialCode)
  const [output, setOutput] = useState("")
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiLoading, setAiLoading] = useState(false)

  const run = () => {
    try{
      // Basit JS çalıştırma — iframe sandbox gibi davran
      // eslint-disable-next-line no-eval
      const fn = new Function(code + "\nreturn typeof result !== 'undefined' ? result : 'Çalıştırıldı';")
      // Capture console.log
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
      const r = await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ title:"Editor AI", content: aiPrompt }), credentials:"include"})
      // Fallback to simple generation via orchestrator
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
    // Ayrıca Drive yedek endpointine bildir
    await fetch("/api/drive", { credentials:"include"})
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2"> <Sparkles className="h-4 w-4"/> AI Kod Editörü ({language})</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={saveToDrive} className="rounded-full"><Save className="h-4 w-4"/> Kaydet</Button>
            <Button size="sm" onClick={run} className="rounded-full bg-white text-black"><Play className="h-4 w-4"/> Çalıştır</Button>
          </div>
        </div>
        <textarea value={code} onChange={e=>setCode(e.target.value)} className="w-full h-[420px] font-mono text-sm bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-white" spellCheck={false}/>
        <div className="flex gap-2">
          <input value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} placeholder="AI'ye sor: Örn. Satış sitesi için ürün kartı yaz" className="flex-1 bg-zinc-950 border border-zinc-800 rounded-full px-4 py-2 text-sm text-white"/>
          <Button onClick={askAI} disabled={aiLoading} className="rounded-full bg-white text-black">{aiLoading?"Yazıyor...":"AI Yazsın"}</Button>
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-xs tracking-widest text-zinc-500">ÇIKTI / ÖNİZLEME</p>
        <div className="h-[420px] bg-white rounded-xl p-4 overflow-auto text-sm text-black font-mono whitespace-pre-wrap border border-zinc-200">
          {output || "Çıktı burada görünecek..."}
        </div>
        <CodeBlock code={code} language={language} prompt={aiPrompt}/>
      </div>
    </div>
  )
}
