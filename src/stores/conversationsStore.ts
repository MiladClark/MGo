import { create } from "zustand";
import type { ChatMessage } from "@/lib/lmstudio/types";
import { loadPersistedFallback, savePersisted } from "@/lib/persist";
import i18n from "@/lib/i18n";

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  model: string;
  updatedAt: number;
  createdAt: number;
}

interface ConversationsState {
  conversations: Conversation[];
  activeId: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
  createConversation: (model?: string) => string;
  setActive: (id: string | null) => void;
  getActive: () => Conversation | undefined;
  updateMessages: (id: string, messages: ChatMessage[]) => void;
  setTitle: (id: string, title: string) => void;
  setModel: (id: string, model: string) => void;
  deleteConversation: (id: string) => void;
  autoTitle: (id: string, firstUserMessage: string) => void;
}

const STORAGE_KEY = "conversations";

function newId() {
  return crypto.randomUUID();
}

/** Titles saved before i18n defaults (English or Persian). */
export function isDefaultChatTitle(title: string): boolean {
  return title === "New chat" || title === "گفتگوی جدید";
}

function defaultTitle() {
  return i18n.t("sidebar.newChat");
}

export const useConversationsStore = create<ConversationsState>((set, get) => ({
  conversations: [],
  activeId: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const saved = await loadPersistedFallback<Conversation[]>(STORAGE_KEY);
      if (saved?.length) {
        set({
          conversations: saved,
          activeId: saved[0]?.id ?? null,
          hydrated: true,
        });
        return;
      }
    } catch {
      /* fall through */
    }
    const id = newId();
    const conv: Conversation = {
      id,
      title: defaultTitle(),
      messages: [],
      model: "",
      updatedAt: Date.now(),
      createdAt: Date.now(),
    };
    set({ conversations: [conv], activeId: id, hydrated: true });
  },

  persist: async () => {
    await savePersisted(STORAGE_KEY, get().conversations);
  },

  createConversation: (model = "") => {
    const id = newId();
    const conv: Conversation = {
      id,
      title: defaultTitle(),
      messages: [],
      model,
      updatedAt: Date.now(),
      createdAt: Date.now(),
    };
    set((s) => ({
      conversations: [conv, ...s.conversations],
      activeId: id,
    }));
    void get().persist();
    return id;
  },

  setActive: (activeId) => set({ activeId }),

  getActive: () => {
    const { conversations, activeId } = get();
    return conversations.find((c) => c.id === activeId);
  },

  updateMessages: (id, messages) => {
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id
          ? { ...c, messages, updatedAt: Date.now() }
          : c,
      ),
    }));
    void get().persist();
  },

  setTitle: (id, title) => {
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, title, updatedAt: Date.now() } : c,
      ),
    }));
    void get().persist();
  },

  setModel: (id, model) => {
    const existing = get().conversations.find((c) => c.id === id);
    if (existing?.model === model) return;
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, model, updatedAt: Date.now() } : c,
      ),
    }));
    void get().persist();
  },

  deleteConversation: (id) => {
    set((s) => {
      const filtered = s.conversations.filter((c) => c.id !== id);
      let activeId = s.activeId;
      if (activeId === id) {
        activeId = filtered[0]?.id ?? null;
      }
      if (filtered.length === 0) {
        const newConvId = newId();
        filtered.push({
          id: newConvId,
          title: defaultTitle(),
          messages: [],
          model: "",
          updatedAt: Date.now(),
          createdAt: Date.now(),
        });
        activeId = newConvId;
      }
      return { conversations: filtered, activeId };
    });
    void get().persist();
  },

  autoTitle: (id, firstUserMessage) => {
    const conv = get().conversations.find((c) => c.id === id);
    if (!conv || !isDefaultChatTitle(conv.title)) return;
    const title =
      firstUserMessage.trim().slice(0, 28) +
      (firstUserMessage.trim().length > 28 ? "…" : "");
    get().setTitle(id, title || defaultTitle());
  },
}));
