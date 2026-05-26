import { create } from "zustand";
import type { Locale } from "@/lib/i18n";
import { applyDocumentLocale } from "@/lib/i18n";
import i18n from "@/lib/i18n";
import { applyColorPalette } from "@/lib/palette";
import type { ColorPaletteId } from "@/lib/palettes";
import { applyTheme } from "@/lib/theme";
import type { ConnectionConfig, InferenceConfig } from "@/lib/lmstudio/types";
import { loadPersistedFallback, savePersisted } from "@/lib/persist";

export type Theme = "light" | "dark";

export interface AppSettings {
  connection: ConnectionConfig;
  inference: InferenceConfig;
  locale: Locale;
  theme: Theme;
  colorPalette: ColorPaletteId;
  defaultModel: string;
}

const defaultSettings: AppSettings = {
  connection: {
    baseUrl: "http://127.0.0.1:1234/v1",
    apiKey: "",
  },
  inference: {
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.95,
    systemPrompt: "",
  },
  locale: "fa",
  theme: "dark",
  colorPalette: "mgo",
  defaultModel: "",
};

interface SettingsState extends AppSettings {
  hydrated: boolean;
  connectionStatus: "unknown" | "connected" | "disconnected";
  setConnection: (c: Partial<ConnectionConfig>) => void;
  setInference: (i: Partial<InferenceConfig>) => void;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: Theme) => void;
  setColorPalette: (palette: ColorPaletteId) => void;
  setDefaultModel: (model: string) => void;
  setConnectionStatus: (s: SettingsState["connectionStatus"]) => void;
  hydrate: () => Promise<void>;
  save: () => Promise<void>;
  applyTheme: () => void;
  applyColorPalette: () => void;
}

const STORAGE_KEY = "settings";


export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaultSettings,
  hydrated: false,
  connectionStatus: "unknown",

  setConnection: (c) => set((s) => ({ connection: { ...s.connection, ...c } })),
  setInference: (i) => set((s) => ({ inference: { ...s.inference, ...i } })),
  setLocale: (locale) => {
    applyDocumentLocale(locale);
    void i18n.changeLanguage(locale);
    set({ locale });
  },
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
    void get().save();
  },
  setColorPalette: (colorPalette) => {
    applyColorPalette(colorPalette);
    set({ colorPalette });
    void get().save();
  },
  setDefaultModel: (defaultModel) => set({ defaultModel }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  applyTheme: () => applyTheme(get().theme),
  applyColorPalette: () => applyColorPalette(get().colorPalette),

  hydrate: async () => {
    try {
      const saved = await loadPersistedFallback<AppSettings>(STORAGE_KEY);
      if (saved) {
        applyDocumentLocale(saved.locale ?? "fa");
        await i18n.changeLanguage(saved.locale ?? "fa");
        applyTheme(saved.theme ?? "dark");
        applyColorPalette(saved.colorPalette ?? "mgo");
        const connection = {
          ...defaultSettings.connection,
          ...saved.connection,
        };
        if (connection.apiKey === "lm-studio") {
          connection.apiKey = "";
        }
        set({
          ...defaultSettings,
          ...saved,
          connection,
          hydrated: true,
        });
        return;
      }
    } catch {
      /* fall through to defaults */
    }
    applyDocumentLocale(defaultSettings.locale);
    applyTheme(defaultSettings.theme);
    applyColorPalette(defaultSettings.colorPalette);
    set({ hydrated: true });
  },

  save: async () => {
    const { connection, inference, locale, theme, colorPalette, defaultModel } =
      get();
    await savePersisted(STORAGE_KEY, {
      connection,
      inference,
      locale,
      theme,
      colorPalette,
      defaultModel,
    });
  },
}));
