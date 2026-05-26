import { create } from "zustand";
import { loadPersisted, savePersisted } from "@/lib/persist";

const STORAGE_KEY = "ui";

interface UiState {
  sidebarOpen: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  sidebarOpen: true,
  hydrated: false,

  hydrate: async () => {
    const saved = await loadPersisted<{ sidebarOpen?: boolean }>(STORAGE_KEY);
    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches;
    set({
      sidebarOpen: saved?.sidebarOpen ?? !isMobile,
      hydrated: true,
    });
  },

  toggleSidebar: () => {
    const next = !get().sidebarOpen;
    set({ sidebarOpen: next });
    void savePersisted(STORAGE_KEY, { sidebarOpen: next });
  },

  setSidebarOpen: (sidebarOpen) => {
    set({ sidebarOpen });
    void savePersisted(STORAGE_KEY, { sidebarOpen });
  },
}));
