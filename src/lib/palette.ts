import {
  type ColorPaletteId,
  isColorPaletteId,
} from "@/lib/palettes";

const DEFAULT_PALETTE: ColorPaletteId = "mgo";

export function applyColorPalette(palette: ColorPaletteId) {
  document.documentElement.dataset.palette = palette;
}

/** Run before React paint to avoid flash */
export function getInitialColorPalette(): ColorPaletteId {
  try {
    const raw = localStorage.getItem("mgo:settings");
    if (raw) {
      const parsed = JSON.parse(raw) as { colorPalette?: string };
      if (
        parsed.colorPalette &&
        isColorPaletteId(parsed.colorPalette)
      ) {
        return parsed.colorPalette;
      }
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_PALETTE;
}
