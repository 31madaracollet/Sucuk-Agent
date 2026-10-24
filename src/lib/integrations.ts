/* Araç ve Bağlantı Entegrasyonları — genişletilmiş destek */
export type IntegrationProvider =
  | "supabase"
  | "github"
  | "google_workspace"
  | "notion"
  | "maps"
  | "google_drive"
  | "terabox"
  | "excel"
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
  { id: "supabase", label: "Supabase", desc: "Sohbet, kullanıcı, proje — kalıcı DB", icon: "Database", color: "bg-green-600", envKeys: ["NEXT_PUBLIC_SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY"] },
  { id: "github", label: "GitHub", desc: "Repo bağla, kodları Agent ile yönet", icon: "Github", color: "bg-zinc-800", envKeys: ["GITHUB_TOKEN"], docsUrl:"https://github.com"},
  { id: "google_workspace", label: "Google Workspace", desc: "Docs / Sheets / Drive entegrasyonu", icon: "FileText", color: "bg-blue-600", envKeys: ["GOOGLE_WORKSPACE_KEY"] },
  { id: "notion", label: "Notion", desc: "Notion sayfalarını bağla, veritabanı senkron", icon: "BookOpen", color: "bg-black", envKeys: ["NOTION_TOKEN"] },
  { id: "maps", label: "Google Haritalar", desc: "Haritalar, yer arama, yol tarifi", icon: "MapPin", color: "bg-red-600", envKeys: ["GOOGLE_MAPS_API_KEY"] },
  { id: "google_drive", label: "Google Drive", desc: "Sohbet yedekleri Drive'a (oto yedek)", icon: "HardDrive", color: "bg-blue-600", envKeys: ["GOOGLE_DRIVE_TOKEN"] },
  { id: "terabox", label: "TeraBox", desc: "TeraBox bulut depolama", icon: "Cloud", color: "bg-sky-600", envKeys: ["TERABOX_TOKEN"] },
  { id: "excel", label: "Excel / Sheets", desc: "Tabloları Agent ile doldur", icon: "Table", color: "bg-emerald-600", envKeys: [] },
  { id: "vercel", label: "Vercel", desc: "Projeyi canlıya al", icon: "Triangle", color: "bg-black", envKeys: ["VERCEL_TOKEN"] },
  { id: "slack", label: "Slack", desc: "Slack bildirim entegrasyonu", icon: "MessageSquare", color: "bg-purple-600", envKeys: [] },
  { id: "discord", label: "Discord", desc: "Discord webhook", icon: "MessageCircle", color: "bg-indigo-600", envKeys: [] },
  { id: "huggingface", label: "Hugging Face", desc: "Görsel + LLM ek API'ler", icon: "Bot", color: "bg-yellow-600", envKeys: ["HUGGINGFACE_API_TOKEN","HUGGINGFACE_API_TOKEN_2","HUGGINGFACE_API_TOKEN_3"] },
  { id: "nvidia", label: "NVIDIA", desc: "Nemotron ek API'ler", icon: "Cpu", color: "bg-green-700", envKeys: ["NVIDIA_API_KEY_1","NVIDIA_API_KEY_2","NVIDIA_API_KEY_3","NVIDIA_API_KEY_4","NVIDIA_API_KEY_5"] },
]

export function getIntegrationStatus(provider: IntegrationProvider): { connected: boolean, missingEnv: string[] } {
  const def = INTEGRATIONS.find(i=>i.id===provider)
  if(!def) return { connected:false, missingEnv:[] }
  const missing = def.envKeys.filter(k=>!process.env[k])
  return { connected: missing.length===0, missingEnv: missing }
}
