import { listTools } from "./storage"
import { getEmbeddedGoogleToken } from "./embedded"

export async function getDriveContext(userId: string) {
  // SIKI PER-USER: sadece bu site hesabına bağlanan Drive — başka kullanıcınınki asla gösterilmez
  const tools = await listTools()
  const allDrives = tools.filter(t => (t.config as any)?.provider === "google_drive" || (t.config as any)?.provider === "google_workspace")
  // 1) Sadece bu kullanıcıya ait olanlar (kullanıcıya özel kalıcı)
  const userDrives = allDrives.filter(t => t.addedBy === userId)
  // 2) Sistem gömülü placeholder sadece UI için — token içermez, fallback değil
  const systemPlaceholders = allDrives.filter(t => t.addedBy === "system-embedded")

  // Kod içine gömülü per-user token de kontrol et (hardcode yedek)
  const embeddedToken = getEmbeddedGoogleToken(userId)
  if (embeddedToken && userDrives.length === 0) {
    // Gömülü token varsa onu kullan — per-user kalıcı
    try {
      const res = await fetch("https://www.googleapis.com/drive/v3/files?pageSize=10&fields=files(id,name,mimeType,modifiedTime,webViewLink)", {
        headers: { Authorization: `Bearer ${embeddedToken}` }
      })
      if (res.ok) {
        const j:any = await res.json()
        return { ok:true, files: j.files||[], source:"embedded_hardcode", connected: [{ name:"Gömülü Drive (kod içine gömülü)", config:{ provider:"google_drive", real:true, embedded:true } }] as any, owner:userId, realAccount:"hardcoded", note:`Drive gömülü token ile kalıcı bağlı — ${userId} hesabına özel (kod içinde)` }
      }
    } catch {}
  }
  // Gerçek OAuth tokeni sadece kendi hesabından
  const realDrive = [...userDrives].reverse().find(t => (t.config as any)?.accessToken && (t.config as any)?.real)
  if (realDrive) {
    try {
      const token = (realDrive.config as any).accessToken
      // accessToken taze mi kontrol — expire olursa refresh dene
      const res = await fetch("https://www.googleapis.com/drive/v3/files?pageSize=10&fields=files(id,name,mimeType,modifiedTime,webViewLink)", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const j:any = await res.json()
        return {
          ok: true,
          files: j.files || [],
          source: "google_drive_api",
          connected: userDrives,
          owner: userId,
          realAccount: (realDrive.config as any)?.email || (realDrive.config as any)?.googleId || realDrive.name,
          note: `Drive bu site hesabına (${userId}) kalıcı bağlı — ${realDrive.name}`
        }
      }
      // 401 ise token expire — not düş
      if (res.status === 401) {
        return {
          ok: false,
          files: [],
          connected: userDrives,
          owner: userId,
          folder: "https://drive.google.com/drive/folders/1WJxce63LuN_LO4Z85x2DXluL0PSDGues",
          note: `Drive token süresi dolmuş — /workspace → Google Gerçek Bağla ile yenile (hesap: ${(realDrive.config as any)?.email || "?"})`,
          expired: true,
        }
      }
    } catch {}
  }
  // Fallback: henüz bağlamadıysa bilgilendir
  return {
    ok: false,
    files: [],
    connected: userDrives,
    placeholders: systemPlaceholders.slice(0,1),
    owner: userId,
    folder: "https://drive.google.com/drive/folders/1WJxce63LuN_LO4Z85x2DXluL0PSDGues",
    note: userDrives.length
      ? `Drive bağlı ama API token taze değil — /workspace'den yeniden bağla (bu hesaba özel, kaybolmaz)`
      : `Drive henüz bu hesaba bağlı değil — /workspace → Google Gerçek Bağla (bir kez bağla, hep bu hesapta kalır)`,
  }
}

export async function getGoogleContext(userId: string) {
  try {
    const tools = await listTools()
    const mine = tools.filter(t =>
      ((t.config as any)?.provider === "google_drive" || (t.config as any)?.provider === "google_workspace") && t.addedBy === userId
    )
    return {
      connected: mine.some(t=> (t.config as any)?.real),
      bindings: mine.map(t=> ({
        id: t.id, name: t.name, provider: (t.config as any)?.provider,
        email: (t.config as any)?.email, real: !!(t.config as any)?.real, addedBy: t.addedBy, createdAt: t.createdAt
      })),
      note: mine.length ? `${mine.length} Google bağlantısı bu hesaba kalıcı` : "Google henüz bu hesaba bağlı değil"
    }
  } catch(e:any){ return { connected:false, bindings:[], note:e.message } }
}

export async function getStorageContext(userId: string) {
  try {
    const { listChats, listFriendships, listProjects } = await import("./storage")
    const [chats, friendships, projects] = await Promise.all([
      listChats(userId).catch(()=>[]),
      listFriendships(userId).catch(()=>[]),
      listProjects(userId).catch(()=>[]),
    ])
    return {
      ok: true,
      owner: userId,
      supabaseConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      persistence: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Supabase kalıcı (hesaba özel)" : "Dosya-fallback (Vercel redeploy'da silinebilir — Supabase env ekle kalıcı olsun)",
      counts: { chats: chats.length, friendships: friendships.length, projects: projects.length },
      recentChats: chats.slice(0,5).map(c=> ({id:c.id, title:c.title, updatedAt:c.updatedAt})),
      friendships: friendships.slice(0,5),
      projects: projects.slice(0,5),
    }
  } catch(e:any) {
    return { ok:false, error: e.message }
  }
}
