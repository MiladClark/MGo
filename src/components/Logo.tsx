import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settingsStore";
import mgoBlack from "@/assets/mgo-black.png";
import mgoWhite from "@/assets/mgo-white.png";
import mgoFavBlack from "@/assets/mgo-fav-black.png";
import mgoFavWhite from "@/assets/mgo-fav-white.png";

interface LogoProps {
  /** Full "MGO" wordmark or square favicon */
  variant?: "wordmark" | "icon";
  className?: string;
}

export function Logo({ variant = "wordmark", className }: LogoProps) {
  const theme = useSettingsStore((s) => s.theme);
  const isDark = theme === "dark";

  const src =
    variant === "icon"
      ? isDark
        ? mgoFavWhite
        : mgoFavBlack
      : isDark
        ? mgoWhite
        : mgoBlack;

  const sizeClass =
    variant === "icon" ? "h-8 w-8 object-contain" : "h-7 w-auto max-w-[140px] object-contain object-right";

  return (
    <img
      src={src}
      alt="MGo"
      className={cn("shrink-0", sizeClass, className)}
      draggable={false}
    />
  );
}
