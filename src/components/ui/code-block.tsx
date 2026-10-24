"use client"
import { useState } from "react"
import { Copy, Check } from "lucide-react"

export function CodeBlock({ code, language = "tsx", prompt }: { code: string, language?: string, prompt?: string }) {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(()=>setCopied(null), 1500)
  }
  return (
    <div className="my-3 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
      <div className="flex items-center justify-between bg-zinc-900 px-3 py-2 border-b border-zinc-800">
        <span className="text-xs font-mono text-zinc-400">{language} {prompt ? "• prompt dahil" : ""}</span>
        <div className="flex gap-2">
          {prompt && (
            <button onClick={()=>copy(prompt, "prompt")} className="flex items-center gap-1 rounded-full bg-zinc-800 px-3 py-1 text-xs text-white hover:bg-zinc-700">
              {copied==="prompt" ? <Check className="h-3 w-3"/> : <Copy className="h-3 w-3"/>} Prompt Kopyala
            </button>
          )}
          <button onClick={()=>copy(code, "code")} className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-black hover:bg-zinc-200">
            {copied==="code" ? <Check className="h-3 w-3"/> : <Copy className="h-3 w-3"/>} Kodu Kopyala
          </button>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed text-zinc-100"><code className="font-mono whitespace-pre">{code}</code></pre>
    </div>
  )
}

export function parseMessageWithCode(content: string) {
  // ```lang\n code \n``` bloklarını ayır
  const parts: { type: 'text'|'code', content: string, lang?: string }[] = []
  const regex = /```(\w+)?\n([\s\S]*?)```/g
  let lastIdx = 0
  let m: RegExpExecArray | null
  while((m = regex.exec(content)) !== null) {
    if(m.index > lastIdx) parts.push({ type:'text', content: content.slice(lastIdx, m.index) })
    parts.push({ type:'code', content: m[2], lang: m[1] || "tsx" })
    lastIdx = m.index + m[0].length
  }
  if(lastIdx < content.length) parts.push({ type:'text', content: content.slice(lastIdx) })
  if(parts.length===0) parts.push({ type:'text', content })
  return parts
}
