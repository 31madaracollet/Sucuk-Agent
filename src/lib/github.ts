import { listTools } from "./storage"

export async function getGithubToken(userId: string): Promise<string | null> {
  // 1. Kullanıcı OAuth tokeni
  try {
    const tools = await listTools()
    const gh = tools.find(t => (t.config as any)?.provider === "github" && (t.addedBy === userId))
    if (gh && (gh.config as any)?.accessToken) return (gh.config as any).accessToken
    const anyGh = tools.find(t => (t.config as any)?.provider === "github" && (gh?.config as any)?.accessToken)
    if (anyGh) return (anyGh.config as any).accessToken
  } catch{}
  // 2. Env fallback (Vercel GITHUB_TOKEN / GH_TOKEN)
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_PAT || null
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
  // mevcut dosyayı kontrol et (sha için)
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

export function parseRepoUrl(input: string): {owner:string,repo:string}|null {
  // https://github.com/owner/repo veya owner/repo
  const m1 = input.match(/github\.com\/([^\/\s]+)\/([^\/\s#?]+)/i)
  if (m1) return { owner: m1[1], repo: m1[2].replace(/\.git$/,"") }
  const m2 = input.match(/\b([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\b/)
  if (m2) return { owner: m2[1], repo: m2[2] }
  return null
}
