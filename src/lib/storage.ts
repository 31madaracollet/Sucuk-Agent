import { supabase, supabaseAdmin, isSupabaseConfigured } from "./supabase";
import type {
  Profile,
  Chat,
  ChatMessage,
  Friendship,
  DirectMessage,
  SystemAnnouncement,
  DynamicTool,
} from "@/types";

/* ------------------------------------------------------------------ */
/*  Demo / fallback store (kullanılırsa Supabase yapılandırılmamışsa) */
/* ------------------------------------------------------------------ */

const demo: {
  profiles: Map<string, Profile>;
  chats: Map<string, Chat>;
  messages: Map<string, ChatMessage[]>;
  friendships: Map<string, Friendship[]>;
  dms: Map<string, DirectMessage[]>;
  announcements: SystemAnnouncement[];
  tools: DynamicTool[];
} = {
  profiles: new Map(),
  chats: new Map(),
  messages: new Map(),
  friendships: new Map(),
  dms: new Map(),
  announcements: [],
  tools: [],
};

const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date().toISOString();

export async function ensureDemoProfiles() {
  const admin = await getProfileByUsername("Sucuk9977");
  if (!admin) {
    await createProfile("demo-admin-001", "Sucuk9977", "admin");
  }
  const user = await getProfileByUsername("Pirensine");
  if (!user) {
    await createProfile("demo-user-001", "Pirensine", "user");
  }
}

export function seedDemoAccounts() {
  const admin: Profile = {
    id: "demo-admin-001",
    username: "Sucuk9977",
    role: "admin",
    createdAt: now(),
  };
  const user: Profile = {
    id: "demo-user-001",
    username: "Pirensine",
    role: "user",
    createdAt: now(),
  };
  demo.profiles.set(admin.id, admin);
  demo.profiles.set(user.id, user);
  return { admin, user };
}

/* ------------------------------------------------------------------ */
/*  Profiles                                                         */
/* ------------------------------------------------------------------ */

export async function getProfileByUsername(username: string) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();
    if (error || !data) return null;
    return data as Profile;
  }
  const found = Array.from(demo.profiles.values()).find(
    (p) => p.username === username
  );
  return found ?? null;
}

export async function getProfile(id: string) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return data as Profile;
  }
  return demo.profiles.get(id) ?? null;
}

export async function createProfile(
  id: string,
  username: string,
  role: "admin" | "user"
) {
  const profile: Profile = { id, username, role, createdAt: now() };
  if (isSupabaseConfigured && supabaseAdmin) {
    await supabaseAdmin.from("profiles").insert([profile]);
  } else {
    demo.profiles.set(id, profile);
  }
  return profile;
}

/* ------------------------------------------------------------------ */
/*  Chats                                                            */
/* ------------------------------------------------------------------ */

export async function listChats(userId: string): Promise<Chat[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .eq("userId", userId)
      .order("updatedAt", { ascending: false });
    if (error) return [];
    return (data ?? []) as Chat[];
  }
  return Array.from(demo.chats.values())
    .filter((c) => c.userId === userId)
    .sort((a, b) => (b.updatedAt < a.updatedAt ? -1 : 1));
}

export async function createChat(
  userId: string,
  title = "Yeni Sohbet"
): Promise<Chat> {
  const chat: Chat = {
    id: id(),
    userId,
    title,
    createdAt: now(),
    updatedAt: now(),
  };
  if (isSupabaseConfigured && supabaseAdmin) {
    await supabaseAdmin.from("chats").insert([chat]);
  } else {
    demo.chats.set(chat.id, chat);
    demo.messages.set(chat.id, []);
  }
  return chat;
}

export async function getChat(chatId: string, userId: string) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .eq("id", chatId)
      .eq("userId", userId)
      .single();
    if (error || !data) return null;
    return data as Chat;
  }
  const chat = demo.chats.get(chatId);
  if (!chat || chat.userId !== userId) return null;
  return chat;
}

export async function updateChatTitle(chatId: string, title: string) {
  if (isSupabaseConfigured && supabaseAdmin) {
    await supabaseAdmin
      .from("chats")
      .update({ title, updatedAt: now() })
      .eq("id", chatId);
  } else {
    const c = demo.chats.get(chatId);
    if (c) {
      c.title = title;
      c.updatedAt = now();
      demo.chats.set(chatId, c);
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Messages                                                         */
/* ------------------------------------------------------------------ */

export async function listMessages(chatId: string): Promise<ChatMessage[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chatId", chatId)
      .order("createdAt", { ascending: true });
    if (error) return [];
    return (data ?? []) as ChatMessage[];
  }
  return demo.messages.get(chatId) ?? [];
}

export async function addMessage(
  chatId: string,
  message: Omit<ChatMessage, "id" | "createdAt">
): Promise<ChatMessage> {
  const m: ChatMessage = { ...message, id: id(), createdAt: now() };
  if (isSupabaseConfigured && supabaseAdmin) {
    await supabaseAdmin.from("messages").insert([m]);
    await supabaseAdmin
      .from("chats")
      .update({ updatedAt: now() })
      .eq("id", chatId);
  } else {
    const arr = demo.messages.get(chatId) ?? [];
    arr.push(m);
    demo.messages.set(chatId, arr);
    const c = demo.chats.get(chatId);
    if (c) {
      c.updatedAt = now();
      demo.chats.set(chatId, c);
    }
  }
  return m;
}

/* ------------------------------------------------------------------ */
/*  Friendships                                                      */
/* ------------------------------------------------------------------ */

export async function listFriendships(userId: string): Promise<Friendship[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("friendships")
      .select("*")
      .or(`userId.eq.${userId},friendId.eq.${userId}`);
    if (error) return [];
    return (data ?? []) as Friendship[];
  }
  return Array.from(demo.friendships.values())
    .flat()
    .filter((f) => f.userId === userId || f.friendId === userId);
}

export async function addFriendship(
  userId: string,
  friendId: string
): Promise<Friendship> {
  const f: Friendship = {
    id: id(),
    userId,
    friendId,
    status: "pending",
    createdAt: now(),
  };
  if (isSupabaseConfigured && supabaseAdmin) {
    await supabaseAdmin.from("friendships").insert([f]);
  } else {
    const arr = demo.friendships.get(userId) ?? [];
    arr.push(f);
    demo.friendships.set(userId, arr);
  }
  return f;
}

export async function acceptFriendship(id: string) {
  if (isSupabaseConfigured && supabaseAdmin) {
    await supabaseAdmin
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", id);
  } else {
    for (const arr of Array.from(demo.friendships.values())) {
      const f = arr.find((x) => x.id === id);
      if (f) f.status = "accepted";
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Direct Messages                                                  */
/* ------------------------------------------------------------------ */

export async function listDirectMessages(
  userId: string,
  otherId: string
): Promise<DirectMessage[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("direct_messages")
      .select("*")
      .or(
        `and(senderId.eq.${userId},receiverId.eq.${otherId}),and(senderId.eq.${otherId},receiverId.eq.${userId})`
      )
      .order("createdAt", { ascending: true });
    if (error) return [];
    return (data ?? []) as DirectMessage[];
  }
  const all = Array.from(demo.dms.values()).flat();
  return all.filter(
    (m) =>
      (m.senderId === userId && m.receiverId === otherId) ||
      (m.senderId === otherId && m.receiverId === userId)
  );
}

export async function addDirectMessage(
  senderId: string,
  receiverId: string,
  content: string
): Promise<DirectMessage> {
  const m: DirectMessage = {
    id: id(),
    senderId,
    receiverId,
    content,
    read: false,
    createdAt: now(),
  };
  if (isSupabaseConfigured && supabaseAdmin) {
    await supabaseAdmin.from("direct_messages").insert([m]);
  } else {
    const arr = demo.dms.get(senderId) ?? [];
    arr.push(m);
    demo.dms.set(senderId, arr);
  }
  return m;
}

/* ------------------------------------------------------------------ */
/*  Announcements                                                    */
/* ------------------------------------------------------------------ */

export async function listAnnouncements(): Promise<SystemAnnouncement[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("system_announcements")
      .select("*")
      .order("createdAt", { ascending: false });
    if (error) return [];
    return (data ?? []) as SystemAnnouncement[];
  }
  return demo.announcements.slice().reverse();
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
  };
  if (isSupabaseConfigured && supabaseAdmin) {
    await supabaseAdmin.from("system_announcements").insert([a]);
  } else {
    demo.announcements.push(a);
  }
  return a;
}

/* ------------------------------------------------------------------ */
/*  Dynamic Tools                                                    */
/* ------------------------------------------------------------------ */

export async function listTools(): Promise<DynamicTool[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("dynamic_tools")
      .select("*")
      .order("createdAt", { ascending: false });
    if (error) return [];
    return (data ?? []) as DynamicTool[];
  }
  return demo.tools.slice().reverse();
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
  };
  if (isSupabaseConfigured && supabaseAdmin) {
    await supabaseAdmin.from("dynamic_tools").insert([t]);
  } else {
    demo.tools.push(t);
  }
  return t;
}

export async function removeTool(id: string) {
  if (isSupabaseConfigured && supabaseAdmin) {
    await supabaseAdmin.from("dynamic_tools").delete().eq("id", id);
  } else {
    demo.tools = demo.tools.filter((t) => t.id !== id);
  }
}
