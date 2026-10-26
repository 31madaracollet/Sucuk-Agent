/* Araç ve Bağlantı Entegrasyonları — defter 1. madde: çoklu araç, GitHub gibi */
export type IntegrationProvider =
  | "supabase"
  | "github"
  | "google_workspace"
  | "google_docs"
  | "google_sheets"
  | "gmail"
  | "google_calendar"
  | "google_drive"
  | "dropbox"
  | "terabox"
  | "notion"
  | "maps"
  | "excel"
  | "figma"
  | "trello"
  | "slack"
  | "discord"
  | "vercel"
  | "huggingface"
  | "nvidia"

export interface IntegrationDef {
  id: IntegrationProvider
  label: string
  desc: string
  icon: string
  color: string
  envKeys: string[]
  docsUrl?: string
}

export const INTEGRATIONS: IntegrationDef[] = [
  { id: "supabase", label: "Supabase", desc: "Sohbet, kullanıcı, proje — kalıcı DB (GitHub gibi çoklu bağlantı)", icon: "Database", color: "bg-green-600", envKeys: ["NEXT_PUBLIC_SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY"] },
  { id: "github", label: "GitHub", desc: "Repo bağla, kodları Agent ile yönet — per-user kalıcı", icon: "Github", color: "bg-zinc-800", envKeys: ["GITHUB_TOKEN"], docsUrl:"https://github.com"},
  { id: "google_workspace", label: "Google Workspace", desc: "Docs / Sheets / Drive / Gmail / Calendar — hepsi", icon: "FileText", color: "bg-blue-600", envKeys: ["GOOGLE_WORKSPACE_KEY"] },
  { id: "google_docs", label: "Google Dokümanlar", desc: "Google Docs — doküman oluştur/oku, Agent ile doldur", icon: "FileText", color: "bg-blue-500", envKeys: ["GOOGLE_DOCS_TOKEN"] },
  { id: "google_sheets", label: "Google Sheets", desc: "Tablolar — Agent ile satır ekle/oku", icon: "Table", color: "bg-emerald-600", envKeys: ["GOOGLE_SHEETS_TOKEN"] },
  { id: "gmail", label: "Gmail", desc: "E-posta oku/gönder — Workspace ile", icon: "Mail", color: "bg-red-500", envKeys: ["GMAIL_TOKEN"] },
  { id: "google_calendar", label: "Google Calendar", desc: "Takvim, hatırlatma — Workspace ile", icon: "Calendar", color: "bg-blue-700", envKeys: ["GOOGLE_CALENDAR_TOKEN"] },
  { id: "google_drive", label: "Google Drive", desc: "Sohbet yedekleri Drive'a (oto yedek) — DM medyası buraya", icon: "HardDrive", color: "bg-blue-600", envKeys: ["GOOGLE_DRIVE_TOKEN"] },
  { id: "dropbox", label: "Dropbox", desc: "Alternatif bulut depolama", icon: "Cloud", color: "bg-sky-700", envKeys: ["DROPBOX_TOKEN"] },
  { id: "terabox", label: "TeraBox", desc: "TeraBox bulut depolama — Drive alternatifi", icon: "Cloud", color: "bg-sky-600", envKeys: ["TERABOX_TOKEN"] },
  { id: "notion", label: "Notion", desc: "Notion sayfalarını bağla, veritabanı senkron", icon: "BookOpen", color: "bg-black", envKeys: ["NOTION_TOKEN"] },
  { id: "maps", label: "Google Haritalar", desc: "Haritalar, yer arama, yol tarifi", icon: "MapPin", color: "bg-red-600", envKeys: ["GOOGLE_MAPS_API_KEY"] },
  { id: "excel", label: "Excel / Sheets", desc: "Tabloları Agent ile doldur — yerel + bulut", icon: "Table", color: "bg-emerald-600", envKeys: [] },
  { id: "figma", label: "Figma", desc: "Tasarım dosyalarını bağla", icon: "Figma", color: "bg-purple-600", envKeys: ["FIGMA_TOKEN"] },
  { id: "trello", label: "Trello", desc: "Panoları Agent ile yönet", icon: "Kanban", color: "bg-blue-500", envKeys: ["TRELLO_TOKEN"] },
  { id: "slack", label: "Slack", desc: "Slack bildirim entegrasyonu", icon: "MessageSquare", color: "bg-purple-600", envKeys: [] },
  { id: "discord", label: "Discord", desc: "Discord webhook", icon: "MessageCircle", color: "bg-indigo-600", envKeys: [] },
  { id: "vercel", label: "Vercel", desc: "Projeyi canlıya al", icon: "Triangle", color: "bg-black", envKeys: ["VERCEL_TOKEN"] },
  { id: "huggingface", label: "Hugging Face", desc: "Görsel + LLM ek API'ler (5 token rotasyon)", icon: "Bot", color: "bg-yellow-600", envKeys: ["HUGGINGFACE_API_TOKEN","HUGGINGFACE_API_TOKEN_2","HUGGINGFACE_API_TOKEN_3"] },
  { id: "nvidia", label: "NVIDIA", desc: "Nemotron ek API'ler (5 anahtar)", icon: "Cpu", color: "bg-green-700", envKeys: ["NVIDIA_API_KEY_1","NVIDIA_API_KEY_2","NVIDIA_API_KEY_3","NVIDIA_API_KEY_4","NVIDIA_API_KEY_5"] },
]

export function getIntegrationStatus(provider: IntegrationProvider): { connected: boolean, missingEnv: string[] } {
  const def = INTEGRATIONS.find(i=>i.id===provider)
  if(!def) return { connected:false, missingEnv:[] }
  const missing = def.envKeys.filter(k=>!process.env[k])
  return { connected: missing.length===0, missingEnv: missing }
}
