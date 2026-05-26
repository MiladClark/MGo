export type ColorPaletteId =
  | "mgo"
  | "ocean"
  | "violet"
  | "rose"
  | "forest"
  | "ember";

export const COLOR_PALETTE_IDS: ColorPaletteId[] = [
  "mgo",
  "ocean",
  "violet",
  "rose",
  "forest",
  "ember",
];

export function isColorPaletteId(value: string): value is ColorPaletteId {
  return COLOR_PALETTE_IDS.includes(value as ColorPaletteId);
}

export interface ColorPaletteMeta {
  id: ColorPaletteId;
  /** Brand display name (English, short) */
  name: string;
  /** Preview swatches for picker cards */
  swatches: [string, string, string, string];
}

export const PALETTES: ColorPaletteMeta[] = [
  {
    id: "mgo",
    name: "MGo",
    swatches: ["#ffc05c", "#121524", "#f6f7fb", "#98a1be"],
  },
  {
    id: "ocean",
    name: "Ocean",
    swatches: ["#2dd4bf", "#0a1628", "#eaf4f6", "#14b8a6"],
  },
  {
    id: "violet",
    name: "Violet",
    swatches: ["#a78bfa", "#130f1f", "#f0ebfa", "#8b5cf6"],
  },
  {
    id: "rose",
    name: "Rose",
    swatches: ["#fb7185", "#1a0c12", "#faf0f2", "#f43f5e"],
  },
  {
    id: "forest",
    name: "Forest",
    swatches: ["#34d399", "#0a1810", "#eaf5ee", "#10b981"],
  },
  {
    id: "ember",
    name: "Ember",
    swatches: ["#f97316", "#181008", "#f5ebe0", "#ea580c"],
  },
];

export function getPaletteMeta(id: ColorPaletteId): ColorPaletteMeta {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}
