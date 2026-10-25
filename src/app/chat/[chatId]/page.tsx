"use client"
import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Send, Bot, Sparkles, Search, Code2, Image as ImageIcon, RefreshCw, Info, AlertCircle, Download, Paperclip, Mic, Trash2, PanelRight, X, Copy, Maximize2, Minimize2, FileText, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { CodeBlock, parseMessageWithCode } from "@/components/ui/code-block"
import { planComplexTask } from "@/lib/orchestrator"

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const chatId = params.chatId as string

  const [messages, setMessages] = useState<any[]>([])
  const [chat, setChat] = useState<any>(null)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [usedProvider, setUsedProvider] = useState<string | null>(null)
  const [usedModel, setUsedModel] = useState<string | null>(null)
  const [limitExhausted, setLimitExhausted] = useState(false)
  const [lastDecision, setLastDecision] = useState<any>(null)
  const [typingId, setTypingId] = useState<string | null>(null)
  const [typedContent, setTypedContent] = useState<Record<string,string>>({})
  const [attachedFile, setAttachedFile] = useState<{name:string,dataUrl:string,type:string}|null>(null)
  const [recording, setRecording] = useState(false)
  const [loadError, setLoadError] = useState<string|null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [artifact, setArtifact] = useState<{title:string, code:string, lang:string} | null>(null)
  const [showArtifact, setShowArtifact] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder|null>(null)
  const fileInputRef = useRef<HTMLInputElement|null>(null)
  const endRef = useRef<HTMLDivElement|null>(null)

  function chatsKey(uid:string){ return `sucuk:chats:${uid}` }
  function chatKey(uid:string,cid:string){ return `sucuk:chat:${uid}:${cid}` }
  function msgsKey(uid:string,cid:string){ return `sucuk:msgs:${uid}:${cid}` }
  async function getUid():Promise<string|null>{ try{ const r=await fetch("/api/auth/me",{credentials:"include"}); const j=await r.json(); if(j.authenticated) return j.user.id }catch{}; return null }

  async function load(){
    try{
      const res = await fetch(`/api/chat/${chatId}`,{credentials:"include"})
      if(!res.ok){
        const j=await res.json().catch(()=>({error:"Bilinmeyen hata"}));
        // Eski generic anahtarları temizle (karışma kaynağı)
        try{
          localStorage.removeItem("sucuk:chats")
          for(let i=localStorage.length-1;i>=0;i--){ const k=localStorage.key(i); if(!k) continue; const parts=k.split(":"); if(k.startsWith("sucuk:chat:") && parts.length===3) localStorage.removeItem(k); if(k.startsWith("sucuk:msgs:") && parts.length===3) localStorage.removeItem(k) }
        }catch{}
        // Per-user restore: server 404 ama local'de bu kullanıcıya aitse aynı id ile geri oluştur (ephemeral kayıp)
        try{
          const uid=await getUid()
          if(uid){
            let cached:any=null
            try{ const raw=localStorage.getItem(chatKey(uid,chatId)); if(raw) cached=JSON.parse(raw)}catch{}
            if(!cached){ try{ const perRaw=localStorage.getItem(chatsKey(uid)); const arr=perRaw?JSON.parse(perRaw):[]; cached=arr.find((c:any)=>c.id===chatId)}catch{} }
            if(cached && cached.userId===uid){
              setLoadError("♻️ Sohbet sunucuda kaybolmuş — aynı linkle geri yükleniyor…")
              const r2=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:cached.title||"Geri yüklenen", restoreId:chatId}),credentials:"include"})
              if(r2.ok){
                // mesajları da geri yükle
                try{ const msgsRaw=localStorage.getItem(msgsKey(uid,chatId)); const msgs=msgsRaw?JSON.parse(msgsRaw):[]; for(const m of msgs.slice(0,40)){ if(m.sender==="user"&&m.content) await fetch(`/api/chat/${chatId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:m.content}),credentials:"include"}).catch(()=>{}) } }catch{}
                setTimeout(()=>load(), 600)
                return
              }
            }
            // silinmiş mi kontrol (tombstone) — geri yükleme yapma
            try{ const dRaw=localStorage.getItem(`sucuk:deleted:${uid}`); const del=dRaw?JSON.parse(dRaw):[]; if(del.includes(chatId)){ setLoadError("Bu sohbet silindi — tamamen kaldırıldı."); return } }catch{}
          }
        }catch{}
        // Vercel cold-start için senkron retry (sadece server listesinde varsa)
        try{
          const listRes=await fetch("/api/chat",{credentials:"include"})
          const listJson=await listRes.json().catch(()=>({}))
          if(listJson.chats?.find((c:any)=>c.id===chatId)){
            setLoadError("Senkronlanıyor… 1 sn sonra tekrar deniyorum")
            setTimeout(()=>load(), 900)
            return
          }
        }catch{}
        setLoadError((j.error||`Yüklenemedi (${res.status})`) + (j.debug ? ` — ${JSON.stringify(j.debug)}` : "")); return
      }
      const data=await res.json()
      setChat(data.chat); setMessages(data.messages??[]); setLoadError(null)
      try{
        const uid=await getUid()
        if(uid){
          localStorage.setItem(chatKey(uid,chatId), JSON.stringify(data.chat))
          localStorage.setItem(msgsKey(uid,chatId), JSON.stringify(data.messages??[]))
          const perKey=chatsKey(uid); const ls=localStorage.getItem(perKey); const arr=ls?JSON.parse(ls):[]; if(!arr.find((c:any)=>c.id===data.chat.id)){ arr.unshift(data.chat); localStorage.setItem(perKey, JSON.stringify(arr)) }
        }
      }catch{}
      const last = (data.messages??[]).slice(-1)[0]
      if(last){
        const parts = parseMessageWithCode(last.content)
        const codePart = parts.find(p=>p.type==="code")
        if(codePart){ setArtifact({title: last.content.slice(0,40) || "Kod", code: codePart.content, lang: codePart.lang||"tsx"}); setShowArtifact(true) }
      }
    }catch(e:any){ setLoadError("Bağlantı hatası: "+e.message)}
  }

  useEffect(()=>{ load(); const id=setInterval(async()=>{ try{ const r=await fetch(`/api/chat/${chatId}`,{credentials:"include"}); if(!r.ok) return; const d=await r.json(); setChat(d.chat); setMessages(d.messages??[])}catch{}},7000); return()=>clearInterval(id)},[chatId])
  useEffect(()=>{ try{ const sp=new URLSearchParams(window.location.search); const f=sp.get("fullscreen"); if(f==="1"||f===null) setIsFullscreen(true); if(f==="0") setIsFullscreen(false)}catch{}},[])
  useEffect(()=>{ const onKey=(e:KeyboardEvent)=>{ if(e.key==="Escape"&&isFullscreen) setIsFullscreen(false)}; window.addEventListener("keydown",onKey); return()=>window.removeEventListener("keydown",onKey)},[isFullscreen])
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth", block:"end"}) },[messages, typingId])
  // localStorage sync — per-user, silinince tamamen gider
  useEffect(()=>{ (async()=>{ try{ if(chatId && messages.length){ const uid=await getUid(); if(uid) localStorage.setItem(msgsKey(uid,chatId), JSON.stringify(messages)) } }catch{} })() },[messages, chatId])

  // typewriter — Claude fade, not harsh
  useEffect(()=>{
    if(!typingId) return
    const full=messages.find(m=>m.id===typingId)?.content||""
    if(!full) return
    let i=0
    const timer=setInterval(()=>{ i+=4; setTypedContent(p=>({...p,[typingId]: full.slice(0,i)})); if(i>=full.length){ clearInterval(timer); setTypingId(null)}},16)
    return()=>clearInterval(timer)
  },[typingId, messages])

  const handleFileChange=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0]; if(!file) return
    const reader=new FileReader(); reader.onload=()=> setAttachedFile({name:file.name, dataUrl: reader.result as string, type:file.type}); reader.readAsDataURL(file)
  }
  const startRecording=async()=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true})
      const mr=new MediaRecorder(stream); const chunks:BlobPart[]=[]
      mr.ondataavailable=e=>chunks.push(e.data)
      mr.onstop=async()=>{
        const blob=new Blob(chunks,{type:"audio/webm"}); setStatus("Groq Whisper yazıya çeviriyor…")
        const fd=new FormData(); fd.append("file",blob,"ses.webm")
        try{ const r=await fetch("/api/stt",{method:"POST",body:fd,credentials:"include"}); const j=await r.json(); if(j.ok&&j.text) setInput(p=>p+(p?" ":"")+j.text); else setStatus("STT hata: "+(j.error||""))}catch(e:any){setStatus("STT hata: "+e.message)}
        setRecording(false); stream.getTracks().forEach(t=>t.stop())
      }
      mediaRecorderRef.current=mr; mr.start(); setRecording(true); setStatus("🎤 Kaydediyor… tekrar bas durdur")
    }catch{ alert("Mikrofon izni ver")}
  }
  const stopRecording=()=>{ mediaRecorderRef.current?.stop(); setRecording(false) }
  async function deleteMsg(id:string){
    if(!confirm("Bu mesaj silinecek. Drive yedeğinden de silinecek — emin misin?")) return
    try{
      const r=await fetch(`/api/chat/${chatId}?messageId=${id}`,{method:"DELETE",credentials:"include"}); const j=await r.json()
      if(!r.ok) alert(j.error||"Silinemedi"); else { setMessages(m=>m.filter(x=>x.id!==id)); setStatus("Silindi — "+(j.driveSync||"Drive senkron")); setTimeout(()=>setStatus(null),3000); window.dispatchEvent(new CustomEvent("sucuk:chatsChanged")) }
    }catch(e:any){ alert("Silme hatası: "+e.message)}
  }

  async function handleSubmit(e:React.FormEvent){
    e.preventDefault()
    if((!input.trim()&&!attachedFile)||sending) return
    let contentToSend=input
    if(attachedFile) contentToSend+=`\n[Dosya: ${attachedFile.name} - ${attachedFile.type}]\n${attachedFile.dataUrl.slice(0,8000)}`
    const userMsg={id:"tmp-"+Date.now(), sender:"user" as const, content: input + (attachedFile?` 📎 ${attachedFile.name}`:""), createdAt:new Date().toISOString()}
    setMessages(m=>[...m, userMsg])
    setSending(true)
    const plan=planComplexTask(input)
    if(plan) setStatus(`🧩 Çoklu görev: ${plan.task} — ${plan.steps.length} adım`)
    else setStatus("Agent rota çiziyor… görsel→FLUX, kod→GPT-OSS 120B, akıl→Reasoner")
    setLimitExhausted(false)
    const bodyMsg=contentToSend
    setInput(""); setAttachedFile(null)
    try{
      const res=await fetch(`/api/chat/${chatId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:bodyMsg, mode:"auto"}),credentials:"include"})
      const data=await res.json()
      if(!res.ok){ setMessages(m=>[...m,{id:"err-"+Date.now(), sender:"assistant", content:`Hata: ${data.error||"Bilinmeyen hata."}`, createdAt:new Date().toISOString()} as any])}
      else{
        setUsedProvider(data.usedProvider??null); setUsedModel(data.usedModel??null); setLastDecision(data.decision??null); setLimitExhausted(Boolean(data.limitExhausted))
        setStatus(data.limitExhausted ? "Limit doldu — yedek beleşe geçildi" : null)
        if(data.toolOutput) setMessages(m=>[...m,{id:"tool-"+Date.now(), sender:"assistant", content:`🔎 Web Arama:\n${data.toolOutput}`, provider:"web-search", createdAt:new Date().toISOString()}])
        const newId="asst-"+Date.now()
        const asst={id:newId, sender:"assistant" as const, content: data.assistant, provider:data.usedProvider, model:data.usedModel, createdAt:new Date().toISOString()}
        setMessages(m=>[...m, asst as any]); setTypedContent(p=>({...p,[newId]:""})); setTypingId(newId)
        // artifact detection for new assistant message
        const parts=parseMessageWithCode(data.assistant||"")
        const cp=parts.find(p=>p.type==="code")
        if(cp){ setArtifact({title:"Artifact — "+(cp.lang||"code"), code: cp.content, lang: cp.lang||"tsx"}); setShowArtifact(true) }
        fetch("/api/drive/auto",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chatId}),credentials:"include"}).catch(()=>{})
      }
    }catch(err:any){ setMessages(m=>[...m,{id:"err2-"+Date.now(), sender:"assistant", content:`Bağlantı hatası: ${err?.message||String(err)}`, createdAt:new Date().toISOString()} as any])}
    finally{ setSending(false); setTimeout(()=>setStatus(null),4000)}
  }

  const providerLabel=(p:string|null)=> ({google:"Google",openai:"OpenAI",groq:"Groq",grok:"Grok",openrouter:"OpenRouter",deepseek:"DeepSeek",kimi:"KIMI",nvidia:"Nvidia",huggingface:"HuggingFace","web-search":"Web Arama"} as any)[p||""] || p || "—"

  function renderMessageContent(content:string, msgId?:string){
    const display = msgId && typedContent[msgId]!==undefined ? typedContent[msgId] : content
    const parts=parseMessageWithCode(display)
    const hasCode=parts.some(p=>p.type==="code")
    if(hasCode){
      return (
        <div className="space-y-3">
          {parts.map((p,i)=> p.type==="code"
            ? <div key={i} className="group/code relative"><CodeBlock code={p.content} language={p.lang||"tsx"} prompt={content.slice(0,200)}/><button onClick={()=>{ setArtifact({title:`${p.lang||"Kod"} — Artifact`, code:p.content, lang:p.lang||"tsx"}); setShowArtifact(true)}} className="absolute top-2 right-2 hidden group-hover/code:flex items-center gap-1 rounded-full bg-[var(--ink)] text-[var(--canvas)] px-2.5 py-1 text-xs"><PanelRight className="h-3 w-3"/> Artifact’te aç</button></div>
            : <span key={i} className="whitespace-pre-wrap break-words leading-[1.7]">{p.content}</span>
          )}
        </div>
      )
    }
    const mdImgRegex=/!\[.*?\]\(([^)]+)\)/g
    const mdMatch=Array.from(display.matchAll(mdImgRegex)).find(m=>m[1].startsWith("data:image/") || m[1].match(/^https?:\/\//))
    if(mdMatch){ const url=mdMatch[1]; const before=display.slice(0, mdMatch.index!); const after=display.slice(mdMatch.index!+mdMatch[0].length); return <><p className="whitespace-pre-wrap break-words leading-[1.7]">{before.trim()}</p><img src={url} alt="generated" className="mt-3 max-w-full rounded-[12px] border border-[var(--hairline)]" onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />{after&&<p className="mt-3 whitespace-pre-wrap break-words text-[var(--ink-soft)]">{after.trim()}</p>}</>}
    const httpImg=display.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|webp)/i)
    if(httpImg) return <><span className="whitespace-pre-wrap break-words leading-[1.7]">{display}</span><img src={httpImg[0]} alt="stock" className="mt-3 max-w-full rounded-[12px] border border-[var(--hairline)]" /></>
    return <span className="whitespace-pre-wrap break-words leading-[1.7]">{display}</span>
  }

  async function downloadPDF(c:string,t:string){ const {jsPDF}=await import("jspdf"); const doc=new jsPDF(); doc.setFontSize(12); doc.text(t,10,15); const lines=doc.splitTextToSize(c,180); doc.setFontSize(10); doc.text(lines,10,25); doc.save(`${t.slice(0,30)}-${Date.now()}.pdf`) }

  // ARTIFACT PANEL — Claude June 2024 split
  const ArtifactPanel = artifact ? (
    <div className="flex flex-col h-full border-l border-[var(--hairline)] bg-[var(--surface)]">
      <div className="h-[56px] flex items-center justify-between px-4 border-b border-[var(--hairline)] bg-[var(--canvas)] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-[8px] bg-[var(--ink)] text-[var(--canvas)] grid place-items-center"><Layers className="h-4 w-4"/></div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{artifact.title}</p>
            <p className="text-xs text-[var(--muted)]">{artifact.lang} • artifact • canlı</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={async()=>{await navigator.clipboard.writeText(artifact.code); setStatus("Kopyalandı"); setTimeout(()=>setStatus(null),1500)}} className="p-2 rounded-[8px] hover:bg-[var(--surface-cream)]"><Copy className="h-4 w-4"/></button>
          <button onClick={()=>setShowArtifact(false)} className="p-2 rounded-[8px] hover:bg-[var(--surface-cream)]"><X className="h-4 w-4"/></button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 bg-[#0a0a0b]">
        <div className="rounded-[12px] border border-white/10 bg-[#141413] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/[0.04]">
            <span className="text-xs font-mono text-white/60">{artifact.lang}</span>
            <span className="text-xs text-white/40">Claude artifact — tek dosya, interaktif</span>
          </div>
          <pre className="p-4 text-sm leading-[1.6] text-zinc-100 overflow-auto max-h-[60vh] font-mono whitespace-pre-wrap break-words">{artifact.code}</pre>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={()=>downloadPDF(artifact.code, artifact.title)} className="rounded-full bg-[var(--ink)] text-[var(--canvas)] px-4 py-2 text-xs font-medium">PDF indir</button>
          <button onClick={async()=>{await navigator.clipboard.writeText(artifact.code)}} className="rounded-full border border-[var(--hairline)] bg-[var(--surface)] px-4 py-2 text-xs">Kopyala</button>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex flex-col h-full border-l border-[var(--hairline)] bg-[var(--canvas-soft)] p-6">
      <p className="font-display text-[18px]">Artifact</p>
      <p className="text-sm text-[var(--muted)] mt-2">Kod veya görsel içeren mesaj gönderdiğinde burada canlı önizleme açılır. Sohbet sol, eser sağ — Claude’un imzası.</p>
      <div className="mt-6 rounded-[12px] border border-dashed border-[var(--hairline)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">Henüz artifact yok. “Python ile todo yaz” veya “köpek çiz” dene.</div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      {!isFullscreen && <Navbar/>}
      <div className="flex flex-1 min-h-0">
        {!isFullscreen && <Sidebar/>}
        <div className={`flex-1 flex flex-col min-h-0 ${isFullscreen ? "fixed inset-0 z-50 bg-[var(--canvas)]" : "min-h-[calc(100vh-64px)]"}`}>
          {/* Top bar — editorial */}
          <div className="shrink-0 sticky top-0 z-10 border-b border-[var(--hairline)] bg-[var(--canvas)]/90 backdrop-blur">
            <div className="mx-auto max-w-[1200px] flex items-center justify-between px-4 md:px-6 py-3 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="h-8 w-8 rounded-[10px] bg-[var(--ink)] text-[var(--canvas)] grid place-items-center shrink-0"><Bot className="h-4 w-4"/></span>
                <div className="min-w-0">
                  <p className="font-display text-[16px] leading-none truncate">{chat?.title || "Sohbet"}</p>
                  <p className="text-xs text-[var(--muted)] truncate">
                    {lastDecision ? <><span className="text-[var(--ink)] font-medium">{lastDecision.agent}</span> • {providerLabel(usedProvider)} • {usedModel}</> : usedProvider ? `${providerLabel(usedProvider)} • ${usedModel}` : "Hazır — beleş öncelikli"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={()=>setIsFullscreen(v=>!v)} className="hidden sm:flex items-center gap-1.5 rounded-full border border-[var(--hairline)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--surface-cream)]">{isFullscreen ? <><Minimize2 className="h-3 w-3"/> Küçült</> : <><Maximize2 className="h-3 w-3"/> Tam ekran</>}</button>
                <button onClick={()=>router.push("/dashboard")} className="rounded-full border border-[var(--hairline)] bg-[var(--surface)] px-3 py-1.5 text-xs hover:bg-[var(--surface-cream)]">← Geri</button>
                <button onClick={()=>setShowArtifact(v=>!v)} className={`hidden lg:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border ${showArtifact ? "bg-[var(--ink)] text-[var(--canvas)] border-transparent" : "bg-[var(--surface)] border-[var(--hairline)] hover:bg-[var(--surface-cream)]"}`}><PanelRight className="h-3 w-3"/> {showArtifact ? "Artifact gizle" : "Artifact"}</button>
                <span className="hidden sm:flex items-center gap-1 rounded-full bg-[var(--ink)] text-[var(--canvas)] px-3 py-1.5 text-xs font-bold"><Sparkles className="h-3 w-3"/> Agent</span>
              </div>
            </div>
          </div>

          {loadError && (
            <div className="mx-auto max-w-[1200px] px-4 pt-3">
              <div className="flex items-center justify-between gap-2 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span>{loadError}</span>
                <div className="flex gap-2 shrink-0">
                  <button onClick={load} className="rounded-full bg-[var(--ink)] text-[var(--canvas)] px-3 py-1 text-xs">Tekrar dene</button>
                  <button onClick={()=>router.push("/dashboard")} className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs">Geri</button>
                </div>
              </div>
            </div>
          )}

          {/* Main split — chat left, artifact right */}
          <div className="flex flex-1 min-h-0">
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              <div className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-[740px] px-4 md:px-6 py-8 space-y-6">
                  {messages.length===0 && (
                    <div className="text-center py-10">
                      <div className="mx-auto h-12 w-12 rounded-[14px] bg-[var(--ink)] text-[var(--canvas)] grid place-items-center mb-4"><Sparkles className="h-6 w-6"/></div>
                      <h3 className="font-display text-[22px]">Nasıl yardımcı olayım?</h3>
                      <p className="mt-2 text-sm text-[var(--muted)] max-w-[560px] mx-auto">Warm paper gündüz, OLED gece. Kod, görsel, arama — artifact sağda canlı.</p>
                      <div className="mt-6 grid grid-cols-2 gap-3 max-w-[560px] mx-auto text-left">
                        <button onClick={()=>setInput("Python ile modern todo uygulaması yaz, artifact'te göster")} className="card-claude p-4 hover:border-[var(--coral)] text-left"><Code2 className="h-4 w-4 mb-2"/><p className="text-sm font-medium">Kod yaz</p><p className="text-xs text-[var(--muted)]">GPT-OSS 120B → artifact</p></button>
                        <button onClick={()=>setInput("Güncel yapay zeka haberlerini ara ve özetle")} className="card-claude p-4 hover:border-[var(--coral)] text-left"><Search className="h-4 w-4 mb-2"/><p className="text-sm font-medium">Web’de ara</p><p className="text-xs text-[var(--muted)]">Groq + DuckDuckGo</p></button>
                        <button onClick={()=>setInput("Uzay temalı bir köpek çiz, poster gibi olsun")} className="card-claude p-4 hover:border-[var(--coral)] text-left"><ImageIcon className="h-4 w-4 mb-2"/><p className="text-sm font-medium">Köpek çiz</p><p className="text-xs text-[var(--muted)]">FLUX.1 → artifact</p></button>
                        <button onClick={()=>setInput("Satış sitesi hazırla: ürün fotoğrafları ve kodları ile tam paket")} className="card-claude p-4 hover:border-[var(--coral)] text-left"><FileText className="h-4 w-4 mb-2"/><p className="text-sm font-medium">Satış sitesi</p><p className="text-xs text-[var(--muted)]">Orchestrator</p></button>
                      </div>
                    </div>
                  )}

                  {messages.map((msg)=>(
                    <div key={msg.id} className={`flex gap-3 ${msg.sender==="user" ? "justify-end" : "justify-start"}`}>
                      {msg.sender==="user" ? (
                        <div className="max-w-[82%] group">
                          <div className="rounded-[16px] rounded-br-[4px] bg-[var(--ink)] text-[var(--canvas)] px-4 py-3 text-[15px] leading-[1.6] shadow-sm relative">
                            {renderMessageContent(msg.content, msg.id)}
                            <button onClick={()=>deleteMsg(msg.id)} className="absolute -top-2 -right-2 hidden group-hover:flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow"><Trash2 className="h-3 w-3"/></button>
                          </div>
                          <p className="mt-1 text-right text-[11px] text-[var(--muted)]">{new Date(msg.createdAt).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})} • Sen</p>
                        </div>
                      ) : (
                        <div className="flex gap-3 max-w-[92%]">
                          <div className="h-7 w-7 rounded-full bg-[var(--surface)] border border-[var(--hairline)] grid place-items-center shrink-0 mt-1"><Bot className="h-3.5 w-3.5"/></div>
                          <div className="min-w-0 flex-1">
                            <div className="rounded-[16px] rounded-tl-[4px] border border-[var(--hairline)] bg-[var(--surface)] px-4 py-3 text-[15px] leading-[1.6] text-[var(--ink)]">
                              {renderMessageContent(msg.content, msg.id)}
                              {typingId===msg.id && <span className="inline-block w-[2px] h-4 bg-[var(--coral)] ml-1 animate-pulse align-middle"/>}
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-[var(--muted)]">
                              <span>{msg.provider ? providerLabel(msg.provider) : "Asistan"} {msg.model ? `• ${msg.model}` : ""} • {new Date(msg.createdAt).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}</span>
                              <button onClick={()=>downloadPDF(msg.content, `sucuk-${msg.id}`)} className="inline-flex items-center gap-1 rounded-full border border-[var(--hairline)] bg-[var(--surface)] px-2.5 py-1 hover:bg-[var(--surface-cream)]"><Download className="h-3 w-3"/> PDF</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>
              </div>

              {status && <div className="mx-auto max-w-[740px] px-4 pb-2"><div className="flex items-center gap-2 rounded-[12px] border border-[var(--hairline)] bg-[var(--surface-cream)] px-3 py-2 text-xs text-[var(--ink-soft)]"><Info className="h-4 w-4 text-[var(--muted)]"/>{status}</div></div>}
              {limitExhausted && <div className="mx-auto max-w-[740px] px-4 pb-2"><div className="flex items-center gap-2 rounded-[12px] border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"><AlertCircle className="h-4 w-4"/> Kota doldu — yedek beleşe geçildi.</div></div>}
              {attachedFile && (
                <div className="mx-auto max-w-[740px] px-4 pb-2">
                  <div className="flex items-center gap-2 rounded-[12px] border border-[var(--hairline)] bg-[var(--surface)] p-3 text-xs">
                    <span className="truncate">📎 {attachedFile.name}</span>
                    {attachedFile.type.startsWith("image/") && <img src={attachedFile.dataUrl} alt="preview" className="h-10 w-10 rounded object-cover"/>}
                    <button onClick={()=>setAttachedFile(null)} className="ml-auto rounded-full bg-[var(--error)] text-white px-3 py-1">Kaldır</button>
                  </div>
                </div>
              )}

              <div className="sticky bottom-0 border-t border-[var(--hairline)] bg-[var(--canvas)]">
                <div className="mx-auto max-w-[740px] px-4 py-3">
                  <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*,.pdf,.txt" className="hidden" onChange={handleFileChange}/>
                  <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-[16px] border border-[var(--hairline)] bg-[var(--surface)] p-2 shadow-[0_1px_8px_rgba(0,0,0,0.06)] focus-within:border-[var(--coral)] focus-within:ring-2 focus-within:ring-[var(--coral)]/10">
                    <button type="button" onClick={()=>fileInputRef.current?.click()} className="h-10 w-10 shrink-0 rounded-[10px] bg-[var(--canvas-soft)] border border-[var(--hairline)] grid place-items-center hover:bg-[var(--surface-cream)]"><Paperclip className="h-4 w-4 text-[var(--muted)]"/></button>
                    <button type="button" onClick={recording ? stopRecording : startRecording} className={`h-10 w-10 shrink-0 rounded-[10px] border grid place-items-center ${recording ? "bg-red-600 border-red-600 text-white animate-pulse" : "bg-[var(--canvas-soft)] border-[var(--hairline)] hover:bg-[var(--surface-cream)] text-[var(--muted)]"}`}><Mic className="h-4 w-4"/></button>
                    <Textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); handleSubmit(e as any)} }} placeholder="Bir şey sor… (@ dosya, 🎤 ses → Groq Whisper)" rows={1} disabled={sending} className="max-h-32 min-h-[42px] flex-1 resize-none border-0 bg-transparent text-[15px] placeholder:text-[var(--muted)] focus:ring-0 shadow-none" />
                    <Button type="submit" disabled={sending || (!input.trim() && !attachedFile)} className="h-10 w-10 shrink-0 rounded-[10px] bg-[var(--coral)] hover:bg-[var(--coral-active)] text-white p-0 disabled:opacity-40">
                      {sending ? <RefreshCw className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                    </Button>
                  </form>
                  <p className="mt-2 text-center text-[11px] text-[var(--muted)]">Enter gönder • Shift+Enter satır • 🎤 Groq Whisper • Supabase + Drive oto-yedek</p>
                </div>
              </div>
            </div>

            {/* Artifact — desktop split, mobile drawer */}
            {showArtifact ? (
              <div className="hidden lg:flex w-[420px] xl:w-[480px] shrink-0">{ArtifactPanel}</div>
            ) : null}
          </div>

          {/* Mobile artifact sheet */}
          {showArtifact && (
            <div className="lg:hidden fixed inset-0 z-40 flex flex-col bg-[var(--canvas)]">
              <div className="flex items-center justify-between p-3 border-b border-[var(--hairline)]">
                <span className="text-sm font-medium">Artifact</span>
                <button onClick={()=>setShowArtifact(false)} className="p-2 rounded-full hover:bg-[var(--surface-cream)]"><X className="h-4 w-4"/></button>
              </div>
              <div className="flex-1 overflow-auto">{ArtifactPanel}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
