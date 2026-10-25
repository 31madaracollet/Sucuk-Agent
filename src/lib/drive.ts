import { supabase } from "./supabase"
import { listTools } from "./storage"

export async function getDriveContext(userId: string) {
  // 1. Kullanıcının bağladığı Drive entegrasyonları
  const tools = await listTools()
  const drives = tools.filter(t => (t.config as any)?.provider === "google_drive" || (t.config as any)?.provider === "google_workspace")
  const userDrives = drives.filter(t => t.addedBy === userId || t.addedBy === "system-embedded")
  
  // 2. Eğer gerçek Google OAuth token varsa Drive API ile listele
  const realDrive = userDrives.find(t => (t.config as any)?.accessToken)
  if (realDrive) {
    try {
      const token = (realDrive.config as any).accessToken
      const res = await fetch("https://www.googleapis.com/drive/v3/files?pageSize=10&fields=files(id,name,mimeType,modifiedTime,webViewLink)", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const j:any = await res.json()
        return { ok: true, files: j.files || [], source: "google_drive_api", connected: userDrives }
      }
    } catch {}
  }
  // 3. Fallback: entegrasyon listesi + sabit klasör
  return {
    ok: false,
    files: [],
    connected: userDrives,
    folder: "https://drive.google.com/drive/folders/1WJxce63LuN_LO4Z85x2DXluL0PSDGues",
    note: userDrives.length ? "Drive bağlı ama API token taze değil — /workspace'den yeniden bağla" : "Drive henüz bağlı değil — /workspace → Google Gerçek Bağla"
  }
}

export async function getStorageContext(userId: string) {
  // Supabase depoları + Vercel file store özet
  try {
    const { listChats, listFriendships, listProjects } = await import("./storage")
    const [chats, friendships, projects] = await Promise.all([
      listChats(userId).catch(()=>[]),
      listFriendships(userId).catch(()=>[]),
      listProjects(userId).catch(()=>[]),
    ])
    return {
      ok: true,
      supabaseConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      counts: { chats: chats.length, friendships: friendships.length, projects: projects.length },
      recentChats: chats.slice(0,5).map(c=> ({id:c.id, title:c.title, updatedAt:c.updatedAt})),
      friendships: friendships.slice(0,5),
      projects: projects.slice(0,5),
    }
  } catch(e:any) {
    return { ok:false, error: e.message }
  }
}
