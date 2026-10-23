import { supabase, supabaseAdmin, isSupabaseConfigured } from "./supabase"
import type {
  Profile,
  Chat,
  ChatMessage,
  Friendship,
  DirectMessage,
  SystemAnnouncement,
  DynamicTool,
} from "@/types"

// Yeni tipler için import (types/index.ts içinde tanımlı olacak)
import type { Notification, Project, ProjectMember } from "@/types"

/* ------------------------------------------------------------------ */
/*  Demo / fallback store (Supabase yoksa RAM)                        */
/* ------------------------------------------------------------------ */

const demo: {
  profiles: Map<string, Profile & { password_hash?: string }>
  chats: Map<string, Chat>
  messages: Map<string, ChatMessage[]>
  friendships: Map<string, Friendship[]>
  dms: Map<string, DirectMessage[]>
  announcements: SystemAnnouncement[]
  tools: DynamicTool[]
  notifications: Map<string, Notification[]>
  projects: Map<string, Project>
  projectMembers: Map<string, ProjectMember[]>
} = {
  profiles: new Map(),
  chats: new Map(),
  messages: new Map(),
  friendships: new Map(),
  dms: new Map(),
  announcements: [],
  tools: [],
  notifications: new Map(),
  projects: new Map(),
  projectMembers: new Map(),
}

const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
const now = () => new Date().toISOString()

// DB <-> JS mapper (snake_case vs camelCase)
const toDbProfile = (p: any) => ({
  id: p.id,
  username: p.username,
  role: p.role,
  created_at: p.createdAt,
  ...(p.password_hash ? { password_hash: p.password_hash } : {}),
})
const fromDbProfile = (r: any): Profile => ({
  id: r.id,
  username: r.username,
  role: r.role,
  createdAt: r.created_at,
  // @ts-ignore
  password_hash: r.password_hash,
})
const toDbChat = (c: Chat) => ({
  id: c.id,
  user_id: c.userId,
  title: c.title,
  created_at: c.createdAt,
  updated_at: c.updatedAt,
})
const fromDbChat = (r: any): Chat => ({
  id: r.id,
  userId: r.user_id,
  title: r.title,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})
const toDbMessage = (m: ChatMessage) => ({
  id: m.id,
  chat_id: m.chatId,
  sender: m.sender,
  content: m.content,
  provider: m.provider ?? null,
  model: m.model ?? null,
  tool_calls: m.toolCalls ?? null,
  created_at: m.createdAt,
})
const fromDbMessage = (r: any): ChatMessage => ({
  id: r.id,
  chatId: r.chat_id,
  sender: r.sender,
  content: r.content,
  provider: r.provider,
  model: r.model,
  toolCalls: r.tool_calls,
  createdAt: r.created_at,
})
const toDbFriendship = (f: Friendship) => ({
  id: f.id,
  user_id: f.userId,
  friend_id: f.friendId,
  status: f.status,
  created_at: f.createdAt,
})
const fromDbFriendship = (r: any): Friendship => ({
  id: r.id,
  userId: r.user_id,
  friendId: r.friend_id,
  status: r.status,
  createdAt: r.created_at,
})
const toDbDM = (m: DirectMessage) => ({
  id: m.id,
  sender_id: m.senderId,
  receiver_id: m.receiverId,
  content: m.content,
  read: m.read,
  created_at: m.createdAt,
})
const fromDbDM = (r: any): DirectMessage => ({
  id: r.id,
  senderId: r.sender_id,
  receiverId: r.receiver_id,
  content: r.content,
  read: r.read,
  createdAt: r.created_at,
})
const toDbAnnouncement = (a: SystemAnnouncement) => ({
  id: a.id,
  title: a.title,
  content: a.content,
  created_by: a.createdBy,
  created_at: a.createdAt,
})
const fromDbAnnouncement = (r: any): SystemAnnouncement => ({
  id: r.id,
  title: r.title,
  content: r.content,
  createdBy: r.created_by,
  createdAt: r.created_at,
})
const toDbTool = (t: DynamicTool) => ({
  id: t.id,
  name: t.name,
  description: t.description,
  config: t.config ?? {},
  added_by: t.addedBy,
  created_at: t.createdAt,
})
const fromDbTool = (r: any): DynamicTool => ({
  id: r.id,
  name: r.name,
  description: r.description,
  config: r.config,
  addedBy: r.added_by,
  createdAt: r.created_at,
})
const toDbNotification = (n: Notification) => ({
  id: n.id,
  user_id: n.userId,
  type: n.type,
  title: n.title,
  content: n.content,
  read: n.read,
  created_at: n.createdAt,
})
const fromDbNotification = (r: any): Notification => ({
  id: r.id,
  userId: r.user_id,
  type: r.type,
  title: r.title,
  content: r.content,
  read: r.read,
  createdAt: r.created_at,
})
const toDbProject = (p: Project) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  owner_id: p.ownerId,
  created_at: p.createdAt,
})
const fromDbProject = (r: any): Project => ({
  id: r.id,
  name: r.name,
  description: r.description,
  ownerId: r.owner_id,
  createdAt: r.created_at,
})
const toDbProjectMember = (pm: ProjectMember) => ({
  id: pm.id,
  project_id: pm.projectId,
  user_id: pm.userId,
  role: pm.role,
  created_at: pm.createdAt,
})
const fromDbProjectMember = (r: any): ProjectMember => ({
  id: r.id,
  projectId: r.project_id,
  userId: r.user_id,
  role: r.role,
  createdAt: r.created_at,
})

export async function ensureDemoProfiles() {
  const admin = await getProfileByUsername("Sucuk9977")
  if (!admin) {
    await createProfile("demo-admin-001", "Sucuk9977", "admin")
  }
  const user = await getProfileByUsername("Pirensine")
  if (!user) {
    await createProfile("demo-user-001", "Pirensine", "user")
  }
}

export function seedDemoAccounts() {
  const admin: Profile = {
    id: "demo-admin-001",
    username: "Sucuk9977",
    role: "admin",
    createdAt: now(),
  }
  const user: Profile = {
    id: "demo-user-001",
    username: "Pirensine",
    role: "user",
    createdAt: now(),
  }
  demo.profiles.set(admin.id, admin)
  demo.profiles.set(user.id, user)
  return { admin, user }
}

/* ------------------------------------------------------------------ */
/*  Profiles                                                         */
/* ------------------------------------------------------------------ */

export async function listProfiles(): Promise<Profile[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: true })
    if (error) { console.error("listProfiles db err", error); return [] }
    return (data ?? []).map(fromDbProfile)
  }
  return Array.from(demo.profiles.values())
}

export async function getProfileByUsername(username: string) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("profiles").select("*").eq("username", username).single()
    if (error || !data) return null
    return fromDbProfile(data)
  }
  const found = Array.from(demo.profiles.values()).find((p) => p.username === username)
  return found ?? null
}

export async function getProfileByUsernameWithPassword(username: string) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("profiles").select("*").eq("username", username).single()
    if (error || !data) return null
    return fromDbProfile(data) as Profile & { password_hash?: string }
  }
  const found = Array.from(demo.profiles.values()).find((p) => p.username === username)
  return (found as any) ?? null
}

export async function getProfile(id: string) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single()
    if (error || !data) return null
    return fromDbProfile(data)
  }
  return demo.profiles.get(id) ?? null
}

export async function createProfile(
  idOrUsername: string,
  usernameOrRole: string,
  roleOrPasswordHash?: string,
  maybeHash?: string
) {
  let nid: string
  let uname: string
  let role: "admin" | "user"
  let pwhash: string | undefined
  if (maybeHash !== undefined) {
    nid = idOrUsername
    uname = usernameOrRole
    role = roleOrPasswordHash as any
    pwhash = maybeHash
  } else if (roleOrPasswordHash && ["admin", "user"].includes(roleOrPasswordHash)) {
    nid = idOrUsername
    uname = usernameOrRole
    role = roleOrPasswordHash as any
  } else {
    nid = idOrUsername
    uname = usernameOrRole
    role = (roleOrPasswordHash as any) ?? "user"
  }
  const profile: any = { id: nid, username: uname, role, createdAt: now(), password_hash: pwhash }
  const dbRow = toDbProfile(profile)
  if (isSupabaseConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin.from("profiles").insert([dbRow])
    if (error) console.error("createProfile db err", error)
  } else {
    demo.profiles.set(nid, profile)
  }
  return profile as Profile
}

export async function deleteProfile(id: string) {
  if (isSupabaseConfigured && supabaseAdmin) {
    await supabaseAdmin.from("profiles").delete().eq("id", id)
  } else {
    demo.profiles.delete(id)
  }
}

/* ------------------------------------------------------------------ */
/*  Chats                                                            */
/* ------------------------------------------------------------------ */

export async function listChats(userId: string): Promise<Chat[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("chats").select("*").eq("user_id", userId).order("updated_at", { ascending: false })
    if (error) { console.error("listChats err", error); return [] }
    return (data ?? []).map(fromDbChat)
  }
  return Array.from(demo.chats.values())
    .filter((c) => c.userId === userId)
    .sort((a, b) => (b.updatedAt < a.updatedAt ? -1 : 1))
}

export async function createChat(userId: string, title = "Yeni Sohbet"): Promise<Chat> {
  const chat: Chat = {
    id: id(),
    userId,
    title,
    createdAt: now(),
    updatedAt: now(),
  }
  const dbRow = toDbChat(chat)
  if (isSupabaseConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin.from("chats").insert([dbRow])
    if (error) console.error("createChat db err", error)
  } else {
    demo.chats.set(chat.id, chat)
    demo.messages.set(chat.id, [])
  }
  return chat
}

export async function getChat(chatId: string, userId: string) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("chats").select("*").eq("id", chatId).eq("user_id", userId).single()
    if (error || !data) return null
    return fromDbChat(data)
  }
  const chat = demo.chats.get(chatId)
  if (!chat || chat.userId !== userId) return null
  return chat
}

export async function updateChatTitle(chatId: string, title: string) {
  if (isSupabaseConfigured && supabaseAdmin) {
    await supabaseAdmin.from("chats").update({ title, updated_at: now() }).eq("id", chatId)
  } else {
    const c = demo.chats.get(chatId)
    if (c) {
      c.title = title
      c.updatedAt = now()
      demo.chats.set(chatId, c)
    }
  }
}

export async function deleteChat(chatId: string, userId: string) {
  if (isSupabaseConfigured && supabaseAdmin) {
    await supabaseAdmin.from("chats").delete().eq("id", chatId).eq("user_id", userId)
    await supabaseAdmin.from("messages").delete().eq("chat_id", chatId)
  } else {
    const c = demo.chats.get(chatId)
    if (c && c.userId === userId) {
      demo.chats.delete(chatId)
      demo.messages.delete(chatId)
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Messages                                                         */
/* ------------------------------------------------------------------ */

export async function listMessages(chatId: string): Promise<ChatMessage[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("messages").select("*").eq("chat_id", chatId).order("created_at", { ascending: true })
    if (error) { console.error("listMessages err", error); return [] }
    return (data ?? []).map(fromDbMessage)
  }
  return demo.messages.get(chatId) ?? []
}

export async function addMessage(
  chatId: string,
  message: Omit<ChatMessage, "id" | "createdAt">
): Promise<ChatMessage> {
  const m: ChatMessage = { ...message, id: id(), createdAt: now() }
  const dbRow = toDbMessage(m)
  if (isSupabaseConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin.from("messages").insert([dbRow])
    if (error) console.error("addMessage err", error)
    await supabaseAdmin.from("chats").update({ updated_at: now() }).eq("id", chatId)
  } else {
    const arr = demo.messages.get(chatId) ?? []
    arr.push(m)
    demo.messages.set(chatId, arr)
    const c = demo.chats.get(chatId)
    if (c) {
      c.updatedAt = now()
      demo.chats.set(chatId, c)
    }
  }
  return m
}

/* ------------------------------------------------------------------ */
/*  Friendships                                                      */
/* ------------------------------------------------------------------ */

export async function listFriendships(userId: string): Promise<Friendship[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("friendships").select("*").or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    if (error) { console.error("listFriendships err", error); return [] }
    return (data ?? []).map(fromDbFriendship)
  }
  return Array.from(demo.friendships.values()).flat().filter((f) => f.userId === userId || f.friendId === userId)
}

export async function addFriendship(userId: string, friendId: string): Promise<Friendship> {
  const f: Friendship = {
    id: id(),
    userId,
    friendId,
    status: "pending",
    createdAt: now(),
  }
  const dbRow = toDbFriendship(f)
  if (isSupabaseConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin.from("friendships").insert([dbRow])
    if (error) console.error("addFriendship err", error)
    // bildirim oluştur
    await createNotification(friendId, "friend_request", "Yeni arkadaş isteği", `${userId} seni ekledi`, friendId)
  } else {
    const arr = demo.friendships.get(userId) ?? []
    arr.push(f)
    demo.friendships.set(userId, arr)
    await createNotification(friendId, "friend_request", "Yeni arkadaş isteği", `${userId} seni ekledi`, friendId)
  }
  return f
}

export async function acceptFriendship(id: string) {
  if (isSupabaseConfigured && supabaseAdmin) {
    await supabaseAdmin.from("friendships").update({ status: "accepted" }).eq("id", id)
  } else {
    for (const arr of Array.from(demo.friendships.values())) {
      const f = arr.find((x) => x.id === id)
      if (f) f.status = "accepted"
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Direct Messages                                                  */
/* ------------------------------------------------------------------ */

export async function listDirectMessages(userId: string, otherId: string): Promise<DirectMessage[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`)
      .order("created_at", { ascending: true })
    if (error) { console.error("listDM err", error); return [] }
    return (data ?? []).map(fromDbDM)
  }
  const all = Array.from(demo.dms.values()).flat()
  return all.filter((m) => (m.senderId === userId && m.receiverId === otherId) || (m.senderId === otherId && m.receiverId === userId))
}

export async function addDirectMessage(senderId: string, receiverId: string, content: string): Promise<DirectMessage> {
  const m: DirectMessage = {
    id: id(),
    senderId,
    receiverId,
    content,
    read: false,
    createdAt: now(),
  }
  const dbRow = toDbDM(m)
  if (isSupabaseConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin.from("direct_messages").insert([dbRow])
    if (error) console.error("addDM err", error)
    await createNotification(receiverId, "dm", "Yeni mesaj", `${senderId}: ${content.slice(0,40)}`, senderId)
  } else {
    const arr = demo.dms.get(senderId) ?? []
    arr.push(m)
    demo.dms.set(senderId, arr)
    await createNotification(receiverId, "dm", "Yeni mesaj", `${senderId}: ${content.slice(0,40)}`, senderId)
  }
  return m
}

/* ------------------------------------------------------------------ */
/*  Announcements                                                    */
/* ------------------------------------------------------------------ */

export async function listAnnouncements(): Promise<SystemAnnouncement[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("system_announcements").select("*").order("created_at", { ascending: false })
    if (error) return []
    return (data ?? []).map(fromDbAnnouncement)
  }
  return demo.announcements.slice().reverse()
}

export async function createAnnouncement(
  title: string,
  content: string,
  createdBy: string
): Promise<SystemAnnouncement> {
  const a: SystemAnnouncement = {
    id: id(),
    title,
    content,
    createdBy,
    createdAt: now(),
  }
  const dbRow = toDbAnnouncement(a)
  if (isSupabaseConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin.from("system_announcements").insert([dbRow])
    if (error) console.error("createAnnouncement err", error)
  } else {
    demo.announcements.push(a)
  }
  // herkese bildirim
  const profiles = await listProfiles()
  for (const p of profiles) {
    await createNotification(p.id, "announcement", title, content, createdBy)
  }
  return a
}

/* ------------------------------------------------------------------ */
/*  Dynamic Tools / Entegrasyonlar                                   */
/* ------------------------------------------------------------------ */

export async function listTools(): Promise<DynamicTool[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("dynamic_tools").select("*").order("created_at", { ascending: false })
    if (error) return []
    return (data ?? []).map(fromDbTool)
  }
  return demo.tools.slice().reverse()
}

export async function addTool(
  name: string,
  description: string,
  config: any,
  addedBy: string
): Promise<DynamicTool> {
  const t: DynamicTool = {
    id: id(),
    name,
    description,
    config,
    addedBy,
    createdAt: now(),
  }
  const dbRow = toDbTool(t)
  if (isSupabaseConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin.from("dynamic_tools").insert([dbRow])
    if (error) console.error("addTool err", error)
  } else {
    demo.tools.push(t)
  }
  return t
}

export async function removeTool(id: string) {
  if (isSupabaseConfigured && supabaseAdmin) {
    await supabaseAdmin.from("dynamic_tools").delete().eq("id", id)
  } else {
    demo.tools = demo.tools.filter((t) => t.id !== id)
  }
}

/* ------------------------------------------------------------------ */
/*  Notifications                                                    */
/* ------------------------------------------------------------------ */

export async function listNotifications(userId: string): Promise<Notification[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50)
    if (error) return []
    return (data ?? []).map(fromDbNotification)
  }
  return (demo.notifications.get(userId) ?? []).slice().reverse()
}

export async function createNotification(
  userId: string,
  type: Notification["type"],
  title: string,
  content: string,
  fromUserId?: string
): Promise<Notification> {
  const n: Notification = {
    id: id(),
    userId,
    type,
    title,
    content,
    fromUserId,
    read: false,
    createdAt: now(),
  }
  const dbRow = toDbNotification(n)
  if (isSupabaseConfigured && supabaseAdmin) {
    await supabaseAdmin.from("notifications").insert([dbRow])
  } else {
    const arr = demo.notifications.get(userId) ?? []
    arr.push(n)
    demo.notifications.set(userId, arr)
  }
  return n
}

export async function markNotificationRead(id: string, userId: string) {
  if (isSupabaseConfigured && supabaseAdmin) {
    await supabaseAdmin.from("notifications").update({ read: true }).eq("id", id).eq("user_id", userId)
  } else {
    const arr = demo.notifications.get(userId) ?? []
    const n = arr.find(x => x.id === id)
    if (n) n.read = true
  }
}

export async function markAllNotificationsRead(userId: string) {
  if (isSupabaseConfigured && supabaseAdmin) {
    await supabaseAdmin.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false)
  } else {
    const arr = demo.notifications.get(userId) ?? []
    arr.forEach(x => x.read = true)
  }
}

/* ------------------------------------------------------------------ */
/*  Projects (arkadaşlarla proje)                                    */
/* ------------------------------------------------------------------ */

export async function listProjects(userId: string): Promise<Project[]> {
  if (isSupabaseConfigured && supabase) {
    // üyesi olduğu projeler
    const { data: members } = await supabase.from("project_members").select("project_id").eq("user_id", userId)
    const ids = (members ?? []).map((m: any) => m.project_id)
    if (ids.length === 0) return []
    const { data, error } = await supabase.from("projects").select("*").in("id", ids).order("created_at", { ascending: false })
    if (error) return []
    return (data ?? []).map(fromDbProject)
  }
  // demo: owner veya member olduğu projeler
  const owned = Array.from(demo.projects.values()).filter(p => p.ownerId === userId)
  const memberOf = Array.from(demo.projectMembers.entries()).flatMap(([_, arr]) => arr.filter(m => m.userId === userId).map(m => demo.projects.get(m.projectId)!)).filter(Boolean)
  return [...owned, ...memberOf]
}

export async function createProject(name: string, description: string, ownerId: string, inviteIds: string[] = []): Promise<Project> {
  const p: Project = {
    id: id(),
    name,
    description,
    ownerId,
    createdAt: now(),
  }
  const dbRow = toDbProject(p)
  if (isSupabaseConfigured && supabaseAdmin) {
    await supabaseAdmin.from("projects").insert([dbRow])
    // owner üye
    await supabaseAdmin.from("project_members").insert([{ id: id(), project_id: p.id, user_id: ownerId, role: "owner", created_at: now() }])
    for (const uid of inviteIds) {
      await supabaseAdmin.from("project_members").insert([{ id: id(), project_id: p.id, user_id: uid, role: "member", created_at: now() }])
      await createNotification(uid, "project_invite", "Projeye davet", `${ownerId} seni "${name}" projesine davet etti`, ownerId)
    }
  } else {
    demo.projects.set(p.id, p)
    const ownerM: ProjectMember = { id: id(), projectId: p.id, userId: ownerId, role: "owner", createdAt: now() }
    demo.projectMembers.set(p.id, [ownerM])
    for (const uid of inviteIds) {
      const m: ProjectMember = { id: id(), projectId: p.id, userId: uid, role: "member", createdAt: now() }
      const arr = demo.projectMembers.get(p.id) ?? []
      arr.push(m)
      demo.projectMembers.set(p.id, arr)
      await createNotification(uid, "project_invite", "Projeye davet", `${ownerId} seni "${name}" projesine davet etti`, ownerId)
    }
  }
  return p
}

export async function listProjectMembers(projectId: string): Promise<ProjectMember[]> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.from("project_members").select("*").eq("project_id", projectId)
    return (data ?? []).map(fromDbProjectMember)
  }
  return demo.projectMembers.get(projectId) ?? []
}

export async function inviteToProject(projectId: string, userId: string, inviterId: string) {
  const m: ProjectMember = { id: id(), projectId, userId, role: "member", createdAt: now() }
  const dbRow = toDbProjectMember(m)
  if (isSupabaseConfigured && supabaseAdmin) {
    await supabaseAdmin.from("project_members").insert([dbRow])
    const proj = await supabaseAdmin.from("projects").select("*").eq("id", projectId).single()
    await createNotification(userId, "project_invite", "Projeye davet", `${inviterId} seni "${(proj.data as any)?.name}" projesine davet etti`, inviterId)
  } else {
    const arr = demo.projectMembers.get(projectId) ?? []
    arr.push(m)
    demo.projectMembers.set(projectId, arr)
    const proj = demo.projects.get(projectId)
    await createNotification(userId, "project_invite", "Projeye davet", `${inviterId} seni "${proj?.name}" projesine davet etti`, inviterId)
  }
  return m
}
