import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import mgoFavBlack from "@/assets/mgo-fav-black.png";
import mgoFavWhite from "@/assets/mgo-fav-white.png";

export function FaviconSync() {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/png";
      document.head.appendChild(link);
    }
    link.href = theme === "dark" ? mgoFavWhite : mgoFavBlack;
  }, [theme]);

  return null;
}
