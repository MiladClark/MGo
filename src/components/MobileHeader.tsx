import { Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

interface MobileHeaderProps {
  onOpenSidebar: () => void;
}

export function MobileHeader({ onOpenSidebar }: MobileHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border/50 bg-background/90 px-3 backdrop-blur-md md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-lg"
        onClick={onOpenSidebar}
        aria-label={t("sidebar.expand")}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Logo variant="icon" className="h-7 w-7" />

      <ThemeToggle className="h-9 w-9 shrink-0 rounded-lg" />
    </header>
  );
}
