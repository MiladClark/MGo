import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetCloseButton,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  PALETTES,
  type ColorPaletteId,
  type ColorPaletteMeta,
} from "@/lib/palettes";
import { useSettingsStore } from "@/stores/settingsStore";

interface PaletteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PalettePreviewCard({
  palette,
  selected,
  tagline,
  onSelect,
}: {
  palette: ColorPaletteMeta;
  selected: boolean;
  tagline: string;
  onSelect: () => void;
}) {
  const [primary, bg, sidebar, muted] = palette.swatches;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border-2 text-start transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "z-10 border-primary shadow-lg shadow-primary/25 ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
          : "border-border/60 hover:border-primary/40 hover:shadow-md",
      )}
    >
      <div
        className="relative flex h-[88px] gap-2 p-2.5"
        style={{ background: bg }}
      >
        <div
          className="w-[28%] shrink-0 rounded-lg border border-black/5"
          style={{ background: sidebar }}
        />
        <div className="flex min-w-0 flex-1 flex-col justify-end gap-1.5">
          <div
            className="ms-auto max-w-[85%] rounded-xl rounded-ee-sm px-2 py-1 text-[9px] leading-tight text-white/90"
            style={{ background: primary }}
          >
            …
          </div>
          <div
            className="h-5 w-10 rounded-md"
            style={{ background: muted }}
          />
        </div>
        {selected && (
          <span className="absolute end-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border/50 bg-card/80 px-3 py-2.5 backdrop-blur-sm">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">
            {palette.name}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">{tagline}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          {palette.swatches.map((color) => (
            <span
              key={color}
              className="h-3.5 w-3.5 rounded-full border border-black/10 shadow-sm"
              style={{ background: color }}
            />
          ))}
        </div>
      </div>
    </button>
  );
}

export function PaletteSheet({ open, onOpenChange }: PaletteSheetProps) {
  const { t } = useTranslation();
  const colorPalette = useSettingsStore((s) => s.colorPalette);
  const setColorPalette = useSettingsStore((s) => s.setColorPalette);

  const select = (id: ColorPaletteId) => {
    setColorPalette(id);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="pb-safe gap-0 p-0">
        <SheetCloseButton />
        <SheetHeader className="shrink-0 px-5 pb-3 pt-1">
          <SheetTitle>{t("palette.title")}</SheetTitle>
          <SheetDescription>{t("palette.subtitle")}</SheetDescription>
        </SheetHeader>

        <div className="mgo-scrollbar grid flex-1 grid-cols-2 gap-3 overflow-y-auto overflow-x-hidden px-5 pt-3 pb-6 sm:grid-cols-3">
          {PALETTES.map((palette) => (
            <PalettePreviewCard
              key={palette.id}
              palette={palette}
              selected={colorPalette === palette.id}
              tagline={t(`palette.names.${palette.id}`)}
              onSelect={() => select(palette.id)}
            />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
