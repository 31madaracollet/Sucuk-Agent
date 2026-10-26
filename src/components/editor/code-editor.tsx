"use client"
import { useState, useRef, useEffect } from "react"
import { Play, Save, Copy, Download, Sparkles, PanelRight, Eye, Github, Square, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/ui/code-block"

const LANGUAGES = ["tsx","ts","javascript","python","html","css","sql","json"] as const

export function CodeEditor({ initialCode = "// Agent kod editörü — AI burada yazar\nconsole.log('Merhaba Sucuk-Agent')", language="tsx" }: { initialCode?: string, language?: string }) {
  const [code, setCode] = useState(initialCode)
  const [displayed, setDisplayed] = useState(initialCode)
  const [output, setOutput] = useState("")
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [lang, setLang] = useState(language)
  const [fileName, setFileName] = useState("agent-output.tsx")
  const [stats, setStats] = useState({ chars: 0, lines: 0, speed: 0 })
  const typingRef = useRef<NodeJS.Timeout|null>(null)
  const abortRef = useRef(false)

  const startTypewriter = (full: string) => {
    setDisplayed(full)
    setCode(full)
    setStats({ chars: full.length, lines: full.split("\n").length, speed: full.length })
    setIsTyping(false)
  }

  const stopTyping = () => {
    abortRef.current = true
    if (typingRef.current) clearTimeout(typingRef.current)
    setIsTyping(false)
  }

  useEffect(()=>()=>{ if(typingRef.current) clearTimeout(typingRef.current) },[])

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
    setOutput(`Agent düşünüyor: "${aiPrompt}" — ${lang} için kod üretiyor... (sadece kod/arama modelleri)`)
    try{
      const chatRes = await fetch("/api/code", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ prompt: aiPrompt, language: lang }), credentials:"include"})
      const j: any = await chatRes.json().catch(async()=> ({ error: await chatRes.text() }))
      if(chatRes.ok && j.ok){
        const newCode = j.code || j.text || ""
        if(newCode){
          const cleaned = newCode.replace(/^```\w*\n?/, "").replace(/```$/, "").trim()
          startTypewriter(cleaned)
          setOutput(`Agent ${cleaned.length} karakter, ${cleaned.split("\n").length} satır yazdı — ${j.usedProvider}/${j.usedModel} (${j.task}) — ön izlemede izle!`)
          try{
            const res = await fetch("/api/drive", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ filename: fileName || `agent-${Date.now()}.${lang}`, content: cleaned, language: lang, prompt: aiPrompt, auto: true }), credentials:"include"})
            const jr:any = await res.json().catch(()=>({})); if(jr?.file?.filename) setFileName(jr.file.filename)
            window.dispatchEvent(new CustomEvent("sucuk:driveChanged"))
          }catch{}
          try{
            const r=await fetch("/api/auth/me",{credentials:"include"}); const me=await r.json(); if(me.authenticated){ const uid=me.user.id; const uname=me.user.username; const safe=uname.replace(/[^a-zA-Z0-9_-]/g,"_").slice(0,24); const prefixed = fileName.startsWith(safe+"-")?fileName:`${safe}-${fileName}`; localStorage.setItem(`sucuk:code:${uid}:${Date.now()}`, JSON.stringify({ fileName: prefixed, lang, code: cleaned, prompt: aiPrompt, username: uname })) }
          }catch{}
        } else {
          setOutput("Agent boş döndü — " + (j.error || JSON.stringify(j).slice(0,300)))
        }
      } else {
        const errMsg = j?.error || j?.message || "Bilinmeyen hata"
        setOutput(`Hata: ${errMsg.slice(0,700)}${j?.attempts ? " — denenen: "+JSON.stringify(j.attempts.slice(0,2)): ""}`)
      }
    }catch(e:any){ setOutput("Hata: "+e.message)}
    setAiLoading(false)
  }

  const saveToDrive = async () => {
    const safeNameRaw = fileName || `agent-code-${Date.now()}.${lang}`
    // kullanıcı adıyla prefix hemen gösterilsin (hangi hesapla kaydedildiyse)
    let displayName = safeNameRaw
    try{
      const r0=await fetch("/api/auth/me",{credentials:"include"}); const me0=await r0.json(); if(me0.authenticated){ const uname0=me0.user.username; const safe0=uname0.replace(/[^a-zA-Z0-9_-]/g,"_").slice(0,24); if(!safeNameRaw.startsWith(safe0+"-")) displayName = `${safe0}-${safeNameRaw}` }
    }catch{}
    try{
      const blob = new Blob([code], { type:"text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href=url; a.download=displayName; a.click()
      URL.revokeObjectURL(url)
    }catch{}
    try{
      const res = await fetch("/api/drive", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ filename: safeNameRaw, content: code, language: lang, prompt: aiPrompt }), credentials:"include"})
      const j = await res.json().catch(()=> ({}))
      if(res.ok){
        const finalName = j.file?.filename || displayName
        if(j.file?.filename) setFileName(j.file.filename)
        setOutput(`Kaydedildi: ${finalName} (${code.length} karakter) — ${j.file?.username || ""} hesabıyla Drive yedeğe alındı${j.driveUrl ? " → "+j.driveUrl : ""} — ön izlemede izle`)
        try{ window.dispatchEvent(new CustomEvent("sucuk:driveChanged")) }catch{}
      } else setOutput(`İndirildi: ${displayName} — Drive: ${j.error || res.statusText}`)
    }catch(e:any){
      setOutput(`İndirildi: ${displayName} — Drive bağlanamadı: ${e.message} — /workspace → Drive Bağla`)
    }
    try{
      const r=await fetch("/api/auth/me",{credentials:"include"}); const me=await r.json(); if(me.authenticated){ const uid=me.user.id; const uname=me.user.username; localStorage.setItem(`sucuk:code:${uid}:${Date.now()}`, JSON.stringify({ fileName: displayName, lang, code, prompt: aiPrompt, username: uname })) }
    }catch{}
  }

  const pushGithub = async () => {
    setOutput("GitHub'a pushlanıyor...")
    const res = await fetch("/api/github/push", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ path: fileName, content: code, message: `Agent: ${aiPrompt.slice(0,60)}` }), credentials:"include"})
    const j = await res.json().catch(()=>({}))
    if(res.ok) setOutput(`GitHub push: ${j.url || j.commit?.html_url || "ok"} — ${fileName}`)
    else setOutput(`Push hata: ${j.error || res.statusText} — önce /workspace → GitHub bağla`)
  }

  // canlı preview için html/js ise iframe
  const previewSrcDoc = (() => {
    if (lang === "html" && code.trim().startsWith("<")) return code
    if (["tsx","ts","javascript"].includes(lang) && code.includes("export default")) {
      return `<!doctype html><html><body><div id="root"></div><script type="module">try{${code}}catch(e){document.body.innerHTML='<pre style=color:red>'+e.message+'</pre>'}</script></body></html>`
    }
    return null
  })()

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-medium flex items-center gap-2"><Sparkles className="h-4 w-4 text-[var(--coral)]"/> AI Kod Editörü <span className="rounded-full bg-[var(--ink)] text-[var(--canvas)] px-2 py-0.5 text-[10px] font-bold">{lang}</span> {isTyping && <span className="rounded-full bg-amber-500 text-white px-2 py-0.5 text-[10px] font-bold animate-pulse flex items-center gap-1"><Eye className="h-3 w-3"/> YAZIYOR...</span>}</h3>
          <div className="flex gap-2 items-center">
            <select value={lang} onChange={e=>setLang(e.target.value)} className="rounded-full border border-[var(--hairline)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium flex items-center gap-1">
              {LANGUAGES.map(l=> <option key={l} value={l}>{l}</option>)}
            </select>
            <Button size="sm" variant="outline" onClick={saveToDrive} className="rounded-full border-[var(--hairline)] bg-[var(--surface)]"><Save className="h-4 w-4"/> Kaydet</Button>
            <Button size="sm" onClick={run} className="btn-coral h-8"><Play className="h-4 w-4"/> Çalıştır</Button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
          <span className="rounded-full border border-[var(--hairline)] bg-[var(--surface)] px-2 py-1 font-mono">{stats.lines} satır • {stats.chars} karakter</span>
          {isTyping && <span className="rounded-full bg-[var(--ink)] text-[var(--canvas)] px-2 py-1 font-mono">{stats.speed} char/s • izliyorsun</span>}
          {isTyping && <Button size="sm" variant="outline" onClick={stopTyping} className="h-6 rounded-full text-xs"><Square className="h-3 w-3"/> Durdur</Button>}
        </div>

        <div className="relative">
          <textarea value={isTyping ? displayed : code} onChange={e=>{ if(!isTyping) {setCode(e.target.value); setDisplayed(e.target.value)}}} className="w-full h-[420px] font-mono text-[13px] leading-[1.6] bg-[var(--ink)] text-[var(--canvas)] border border-[var(--hairline)] rounded-[12px] p-4 focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/20 focus:border-[var(--coral)]" spellCheck={false} placeholder="Kod burada — AI canlı yazarken izle..."/>
          {isTyping && <div className="absolute bottom-3 right-3 rounded-full bg-amber-500 text-white px-3 py-1 text-xs font-bold animate-pulse flex items-center gap-2"><Wand2 className="h-3 w-3"/> Agent yazıyor...</div>}
        </div>

        <div className="flex gap-2">
          <input value={fileName} onChange={e=>setFileName(e.target.value)} placeholder="dosya-adi.tsx" className="w-[180px] rounded-full border border-[var(--hairline)] bg-[var(--surface)] px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--coral)]"/>
          <input value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askAI()} placeholder="AI'ye söyle: Örn. Koyu tema to-do list React bileşeni yaz" className="flex-1 rounded-full border border-[var(--hairline)] bg-[var(--surface)] px-4 py-2.5 text-sm placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--coral)]"/>
          <Button onClick={askAI} disabled={aiLoading||isTyping} className="btn-coral rounded-full whitespace-nowrap">{aiLoading?"Düşünüyor...": isTyping ? "Yazıyor..." : "AI Yazsın → İzle"}</Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={pushGithub} variant="outline" className="rounded-full border-[var(--hairline)] bg-[var(--surface)] flex-1"><Github className="h-4 w-4"/> GitHub'a Pushla</Button>
          <Button onClick={saveToDrive} variant="outline" className="rounded-full border-[var(--hairline)] bg-[var(--surface)]"><Download className="h-4 w-4"/> İndir</Button>
        </div>
        <p className="text-xs text-[var(--muted)] text-center">Sadece kod/arama modelleri — hız {stats.speed} char/s • Drive'a oto-kayıt • ön izleme sağda</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] tracking-[0.12em] font-semibold text-[var(--muted)] flex items-center gap-2"><PanelRight className="h-3 w-3"/> ÇIKTI / ARTIFACT — ÖN İZLEME {isTyping && <span className="text-amber-600">• CANLI</span>}</p>
          <div className="flex gap-1">
            <button onClick={async()=>{ await navigator.clipboard.writeText(code)}} className="p-2 rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] hover:bg-[var(--surface-cream)]"><Copy className="h-3 w-3"/></button>
            <button onClick={saveToDrive} className="p-2 rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] hover:bg-[var(--surface-cream)]"><Download className="h-3 w-3"/></button>
          </div>
        </div>
        <div className="h-[420px] rounded-[12px] border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden flex flex-col">
          <div className="flex-1 p-4 overflow-auto font-mono text-sm whitespace-pre-wrap bg-[var(--canvas-soft)] text-[var(--ink)] border-b border-[var(--hairline)]">
            {isTyping ? <span className="inline-flex items-center gap-2">{output}<span className="h-4 w-[2px] bg-[var(--coral)] animate-pulse inline-block"/></span> : (output || "Çıktı burada — Run'a bas. AI yazarken canlı izle")}
          </div>
          {/* Gerçek ön izleme: html ise iframe, değilse CodeBlock */}
          {previewSrcDoc ? (
            <div className="p-2 bg-white flex-1 flex flex-col min-h-0">
              <p className="text-[10px] text-[var(--muted)] mb-1">Ön izleme (iframe)</p>
              <iframe srcDoc={previewSrcDoc} className="w-full flex-1 rounded-[8px] border border-[var(--hairline)] bg-white" sandbox="allow-scripts" />
            </div>
          ) : (
            <div className="p-3 bg-[var(--surface)] max-h-[220px] overflow-auto">
              <CodeBlock code={isTyping ? displayed : code} language={lang} prompt={aiPrompt}/>
            </div>
          )}
        </div>
        <p className="text-xs text-[var(--muted)] text-center">Agent modu: Sen söyle, AI yazsın, Drive'a kaydedilsin, sağda ön izle</p>
      </div>
    </div>
  )
}
