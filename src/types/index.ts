export type ProviderId =
  | "google"
  | "openai"
  | "groq"
  | "grok"
  | "openrouter"
  | "deepseek"
  | "kimi"
  | "nvidia"
  | "huggingface";

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

export interface RouteDecision {
  agent: "code" | "image" | "search" | "reasoning" | "text" | "chat";
  provider: ProviderId;
  model: string;
  reason: string;
}
