import { useState } from "react";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaletteSheet } from "@/features/appearance/PaletteSheet";
import { getPaletteMeta } from "@/lib/palettes";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTranslation } from "react-i18next";

interface PaletteToggleProps {
  className?: string;
}

export function PaletteToggle({ className }: PaletteToggleProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const colorPalette = useSettingsStore((s) => s.colorPalette);
  const meta = getPaletteMeta(colorPalette);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={className}
        onClick={() => setOpen(true)}
        title={t("palette.title")}
      >
        <span className="relative flex h-4 w-4 items-center justify-center">
          <Palette className="h-4 w-4 opacity-90" />
          <span
            className="absolute -bottom-0.5 -end-0.5 h-2 w-2 rounded-full border border-background shadow-sm"
            style={{ background: meta.swatches[0] }}
          />
        </span>
      </Button>
      <PaletteSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
