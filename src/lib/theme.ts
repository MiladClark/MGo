import type { Theme } from "@/stores/settingsStore";

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

/** Run before React paint to avoid flash */
export function getInitialTheme(): Theme {
  try {
    const raw = localStorage.getItem("mgo:settings");
    if (raw) {
      const parsed = JSON.parse(raw) as { theme?: Theme };
      if (parsed.theme === "light" || parsed.theme === "dark") {
        return parsed.theme;
      }
    }
  } catch {
    /* ignore */
  }
  return "dark";
}
