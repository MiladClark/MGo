import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import mgoLogoDark from "@/assets/new-logo.svg";
import mgoLogoLight from "@/assets/new-logo-black.svg";

export function FaviconSync() {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.type = "image/svg+xml";
    link.href = theme === "dark" ? mgoLogoDark : mgoLogoLight;
  }, [theme]);

  return null;
}
