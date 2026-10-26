export type ProviderId =
  | "google"
  | "openai"
  | "groq"
  | "grok"
  | "openrouter"
  | "deepseek"
  | "kimi"
  | "nvidia"
  | "huggingface"
  | "pollinations";

export interface ProviderKey {
  provider: ProviderId;
  index: number; // 1..3
  key: string;
  healthy: boolean;
  lastError?: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  sender: "user" | "assistant" | "system";
  content: string;
  provider?: string;
  model?: string;
  toolCalls?: any[];
  createdAt: string;
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  username: string;
  role: "admin" | "user";
  createdAt: string;
}

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  status: "pending" | "accepted" | "blocked";
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | "audio" | null;
  read: boolean;
  createdAt: string;
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface DynamicTool {
  id: string;
  name: string;
  description: string;
  config: any;
  addedBy: string;
  createdAt: string;
}

import type { ModelTask } from "@/lib/providers";

export interface RouteDecision {
  agent: "code" | "image" | "search" | "reasoning" | "text" | "chat";
  provider: ProviderId;
  model: string;
  reason: string;
  task: ModelTask;
}


export interface Notification {
  id: string
  userId: string
  type: "friend_request" | "friend_accepted" | "dm" | "project_invite" | "announcement" | "system"
  title: string
  content: string
  fromUserId?: string
  read: boolean
  createdAt: string
}

export interface Project {
  id: string
  name: string
  description: string
  ownerId: string
  createdAt: string
}

export interface ProjectMember {
  id: string
  projectId: string
  userId: string
  role: "owner" | "member"
  createdAt: string
}

export interface IntegrationConfig {
  id: string
  provider: "supabase" | "github" | "google_drive" | "terabox" | "workspace" | "excel" | "notion" | "vercel" | "google_workspace" | "maps" | "huggingface" | "nvidia" | "slack" | "discord"
  name: string
  connected: boolean
  config: any
  createdAt: string
}
