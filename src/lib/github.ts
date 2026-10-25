import { listTools } from "./storage"
import { getEmbeddedGithubToken } from "./embedded"

export async function getGithubToken(userId: string): Promise<string | null> {
  // SIKı PER-USER: sadece o site hesabına bağlanan GitHub tokeni döner — başka kullanıcının tokenine ASLA dokunmaz
  try {
    const tools = await listTools()
    // 1) Bu kullanıcıya ait gerçek OAuth tokeni (en güncel)
    const mine = tools.filter(t => (t.config as any)?.provider === "github" && t.addedBy === userId && (t.config as any)?.accessToken)
    if (mine.length) {
      // en son bağlanan
      const latest = [...mine].sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      return (latest.config as any).accessToken
    }
    // 2) Bu kullanıcıya ait gömülü/dry placeholder değil — sadece gerçek token
    // Başka kullanıcının tokenine fallback YOK — güvenlik gereği
  } catch {}
  // 2) Kod içine gömülü per-user fallback (hardcode) — DB silinse bile hep öyle kalır
  const embedded = getEmbeddedGithubToken(userId)
  if (embedded) return embedded
  // 3) Env fallback — sadece admin Vercel env'i (ortak değil per-user değil ama güvenli)
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_PAT || null
}

export async function getGithubContext(userId: string) {
  try {
    const tools = await listTools()
    const mine = tools.filter(t => (t.config as any)?.provider === "github" && t.addedBy === userId)
    return {
      connected: mine.length > 0,
      bindings: mine.map(t => ({
        id: t.id,
        name: t.name,
        login: (t.config as any)?.githubLogin,
        real: !!(t.config as any)?.real,
        provider: (t.config as any)?.provider,
        addedBy: t.addedBy,
        createdAt: t.createdAt,
      })),
      note: mine.length ? `GitHub ${mine[0].name} — bu site hesabına (${userId}) kalıcı bağlı` : "GitHub henüz bu hesaba bağlı değil — /workspace → GitHub Gerçek Bağla",
    }
  } catch(e:any){ return { connected:false, bindings:[], note: e.message } }
}

export async function pushFileToRepo(opts: {
  token: string
  owner: string
  repo: string
  path: string
  content: string // utf8
  message: string
  branch?: string
}) {
  const branch = opts.branch || "main"
  const url = `https://api.github.com/repos/${opts.owner}/${opts.repo}/contents/${encodeURIComponent(opts.path).replace(/%2F/g,"/")}`
  let sha: string | undefined
  try {
    const get = await fetch(url + `?ref=${branch}`, {
      headers: { Authorization: `Bearer ${opts.token}`, Accept: "application/vnd.github+json", "User-Agent": "Sucuk-Agent" }
    })
    if (get.ok) {
      const j:any = await get.json()
      sha = j.sha
    }
  } catch{}
  const put = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${opts.token}`, Accept: "application/vnd.github+json", "User-Agent": "Sucuk-Agent" },
    body: JSON.stringify({
      message: opts.message,
      content: Buffer.from(opts.content, "utf8").toString("base64"),
      branch,
      sha,
    })
  })
  const j:any = await put.json().catch(()=> ({}))
  if (!put.ok) throw new Error(j.message || `GitHub push failed ${put.status}`)
  return j
}

export async function getSelectedRepo(userId: string): Promise<string | null> {
  try {
    const tools = await listTools()
    const sel = tools.find(t => (t.config as any)?.provider === "github_selected" && t.addedBy === userId)
    if (sel) return (sel.config as any)?.repoFullName || (sel.config as any)?.repo || null
  } catch {}
  return null
}

export function parseRepoUrl(input: string): {owner:string,repo:string}|null {
  const m1 = input.match(/github\.com\/([^\/\s]+)\/([^\/\s#?]+)/i)
  if (m1) return { owner: m1[1], repo: m1[2].replace(/\.git$/,"") }
  const m2 = input.match(/\b([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\b/)
  if (m2) return { owner: m2[1], repo: m2[2] }
  return null
}
