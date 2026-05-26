import { create } from "zustand";
import {
  buildApiUserContent,
  buildUserMessageText,
  type PendingAttachment,
} from "@/lib/attachments";
import { chatStream, listModels } from "@/lib/lmstudio/client";
import type { ApiChatMessage, ChatMessage, LmModel } from "@/lib/lmstudio/types";
import { useConversationsStore } from "./conversationsStore";
import { useSettingsStore } from "./settingsStore";

function newMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    createdAt: Date.now(),
  };
}

interface ChatState {
  models: LmModel[];
  selectedModel: string;
  isStreaming: boolean;
  isLoadingModels: boolean;
  error: string | null;
  abortController: AbortController | null;
  fetchModels: () => Promise<void>;
  setSelectedModel: (model: string) => void;
  sendMessage: (
    content: string,
    attachments?: PendingAttachment[],
  ) => Promise<void>;
  stopStreaming: () => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  models: [],
  selectedModel: "",
  isStreaming: false,
  isLoadingModels: false,
  error: null,
  abortController: null,

  setSelectedModel: (selectedModel) => {
    const active = useConversationsStore.getState().getActive();
    const settings = useSettingsStore.getState();
    const unchanged =
      get().selectedModel === selectedModel &&
      (!active || active.model === selectedModel) &&
      settings.defaultModel === selectedModel;
    if (unchanged) return;

    set({ selectedModel });
    if (active && active.model !== selectedModel) {
      useConversationsStore.getState().setModel(active.id, selectedModel);
    }
    if (settings.defaultModel !== selectedModel) {
      settings.setDefaultModel(selectedModel);
      void settings.save();
    }
  },

  fetchModels: async () => {
    const { connection } = useSettingsStore.getState();
    set({ isLoadingModels: true, error: null });
    try {
      const res = await listModels(connection);
      const models = res.data ?? [];
      set({ models, isLoadingModels: false });
      useSettingsStore.getState().setConnectionStatus("connected");
      const { selectedModel, defaultModel } = {
        selectedModel: get().selectedModel,
        defaultModel: useSettingsStore.getState().defaultModel,
      };
      const active = useConversationsStore.getState().getActive();
      const preferred =
        active?.model ||
        selectedModel ||
        defaultModel ||
        models[0]?.id ||
        "";
      if (preferred && get().selectedModel !== preferred) {
        get().setSelectedModel(preferred);
      }
    } catch {
      set({ models: [], isLoadingModels: false });
      useSettingsStore.getState().setConnectionStatus("disconnected");
    }
  },

  clearError: () => set({ error: null }),

  stopStreaming: () => {
    get().abortController?.abort();
    set({ isStreaming: false, abortController: null });
  },

  sendMessage: async (content: string, attachments: PendingAttachment[] = []) => {
    const trimmed = content.trim();
    const hasAttachments = attachments.length > 0;
    if ((!trimmed && !hasAttachments) || get().isStreaming) return;

    const settings = useSettingsStore.getState();
    const convStore = useConversationsStore.getState();
    const active = convStore.getActive();
    if (!active) return;

    const model = get().selectedModel || active.model || settings.defaultModel;
    if (!model) {
      set({ error: "noModel" });
      return;
    }

    const displayText = buildUserMessageText(trimmed, attachments);
    const userMsg: ChatMessage = {
      ...newMessage("user", displayText),
      attachments: attachments.map((a) => ({
        id: a.id,
        type: a.type,
        name: a.name,
        mimeType: a.mimeType,
        previewUrl: a.type === "image" ? a.dataUrl : undefined,
      })),
    };
    const messages = [...active.messages, userMsg];
    convStore.updateMessages(active.id, messages);
    convStore.autoTitle(active.id, trimmed || attachments[0]?.name || "پیوست");

    const assistantMsg = newMessage("assistant", "");
    const withAssistant = [...messages, assistantMsg];
    convStore.updateMessages(active.id, withAssistant);

    const apiMessages: ApiChatMessage[] = messages.map((m) => {
      if (m.id === userMsg.id) {
        return {
          role: "user" as const,
          content: buildApiUserContent(trimmed, attachments),
        };
      }
      return { role: m.role, content: m.content };
    });

    const controller = new AbortController();
    set({ isStreaming: true, error: null, abortController: controller });

    let accumulated = "";

    await chatStream(
      settings.connection,
      settings.inference,
      model,
      apiMessages,
      {
        onDelta: (text) => {
          accumulated += text;
          const updated = withAssistant.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: accumulated }
              : m,
          );
          convStore.updateMessages(active.id, updated);
        },
        onDone: () => {
          set({ isStreaming: false, abortController: null });
        },
        onError: () => {
          set({
            isStreaming: false,
            abortController: null,
            error: "generic",
          });
        },
      },
      controller.signal,
    );
  },
}));
