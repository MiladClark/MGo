export type ChatRole = "system" | "user" | "assistant";

export interface MessageAttachmentMeta {
  id: string;
  type: "image" | "file";
  name: string;
  mimeType: string;
  previewUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  attachments?: MessageAttachmentMeta[];
}

export type ApiMessageContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

export interface ApiChatMessage {
  role: ChatRole;
  content: ApiMessageContent;
}

export interface LmModel {
  id: string;
  /** Friendly UI label derived from id */
  displayName?: string;
  object?: string;
  owned_by?: string;
  /** From LM Studio /api/v0/models when available; else name heuristic */
  supportsVision?: boolean;
}

export interface ModelsResponse {
  data: LmModel[];
  object?: string;
}

export interface ChatCompletionChunk {
  id?: string;
  choices?: Array<{
    index?: number;
    delta?: { role?: string; content?: string };
    finish_reason?: string | null;
  }>;
  error?: { message?: string };
}

export interface ConnectionConfig {
  baseUrl: string;
  apiKey: string;
}

export interface InferenceConfig {
  temperature: number;
  maxTokens: number;
  topP: number;
  systemPrompt: string;
}
