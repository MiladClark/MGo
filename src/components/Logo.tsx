import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settingsStore";
import mgoLogoDark from "@/assets/new-logo.svg";
import mgoLogoLight from "@/assets/new-logo-black.svg";

interface LogoProps {
  /** Full wordmark or square icon */
  variant?: "wordmark" | "icon";
  className?: string;
}

export function Logo({ variant = "wordmark", className }: LogoProps) {
  const theme = useSettingsStore((s) => s.theme);
  const src = theme === "dark" ? mgoLogoDark : mgoLogoLight;

  const sizeClass =
    variant === "icon"
      ? "h-8 w-8 object-contain"
      : "h-7 w-auto max-w-[140px] object-contain object-right";

  return (
    <img
      src={src}
      alt="MGo"
      className={cn("shrink-0", sizeClass, className)}
      draggable={false}
    />
  );
}
