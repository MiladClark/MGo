import type { LmModel } from "@/lib/lmstudio/types";

/** Fallback when LM Studio /api/v0/models is unavailable */
const VISION_NAME_PATTERNS: RegExp[] = [
  /llava/i,
  /bakllava/i,
  /vision/i,
  /-vl\b/i,
  /_vl\b/i,
  /\bvl\b/i,
  /gemma-?[23]/i,
  /qwen.*vl/i,
  /internvl/i,
  /pixtral/i,
  /cogvlm/i,
  /moondream/i,
  /minicpm-v/i,
  /minicpm\.v/i,
  /phi-?3\.?5?-vision/i,
  /phi-?3-vision/i,
  /idefics/i,
  /fuyu/i,
  /bunny/i,
  /llama-?3\.2.*vision/i,
  /smolvlm/i,
  /paligemma/i,
  /kosmos/i,
  /deepseek-vl/i,
  /glm-?4v/i,
  /mistral-small.*vision/i,
  /granite-?vision/i,
];

function normalizeModelKey(id: string): string {
  return id.trim().split("@")[0].toLowerCase();
}

function inferVisionFromName(modelId: string): boolean {
  const id = modelId.trim();
  if (!id) return false;
  return VISION_NAME_PATTERNS.some((pattern) => pattern.test(id));
}

function lookupApiVision(
  modelId: string,
  visionById: Map<string, boolean>,
): boolean | undefined {
  if (visionById.has(modelId)) return visionById.get(modelId);
  const base = normalizeModelKey(modelId);
  for (const [key, vision] of visionById) {
    if (normalizeModelKey(key) === base) return vision;
  }
  return undefined;
}

export function mergeModelVision(
  openAiModels: LmModel[],
  visionById: Map<string, boolean>,
): LmModel[] {
  return openAiModels.map((m) => {
    const fromApi = lookupApiVision(m.id, visionById);
    return {
      ...m,
      supportsVision:
        fromApi !== undefined ? fromApi : inferVisionFromName(m.id),
    };
  });
}

export function supportsModelVision(
  modelId: string,
  models?: Pick<LmModel, "id" | "supportsVision">[],
): boolean {
  const id = modelId.trim();
  if (!id) return false;

  const entry = models?.find(
    (m) => m.id === id || normalizeModelKey(m.id) === normalizeModelKey(id),
  );
  if (entry?.supportsVision !== undefined) return entry.supportsVision;

  return inferVisionFromName(id);
}

export function getClipboardImageFiles(data: DataTransfer): File[] {
  const seen = new Set<File>();
  const add = (file: File | null) => {
    if (file?.type.startsWith("image/")) seen.add(file);
  };

  for (const file of Array.from(data.files)) {
    add(file);
  }
  for (const item of Array.from(data.items)) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      add(item.getAsFile());
    }
  }
  return [...seen];
}
