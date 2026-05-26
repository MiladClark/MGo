import type { LmModel } from "./types";

export interface NativeModelInfo {
  id: string;
  type?: string;
  supportsVision: boolean;
}

function normalizeModelKey(id: string): string {
  return id.trim().split("@")[0].toLowerCase();
}

function findNativeMeta(
  modelId: string,
  native: NativeModelInfo[],
): NativeModelInfo | undefined {
  const base = normalizeModelKey(modelId);
  return native.find(
    (n) => n.id === modelId || normalizeModelKey(n.id) === base,
  );
}

/** Embedding / non-chat models must not appear in the chat model picker. */
export function isChatModel(modelId: string, native: NativeModelInfo[]): boolean {
  const meta = findNativeMeta(modelId, native);
  if (meta?.type) {
    const t = meta.type.toLowerCase();
    if (t === "embeddings" || t === "embedding") return false;
    if (t === "llm" || t === "vlm") return true;
  }

  const id = modelId.toLowerCase();
  if (id.startsWith("text-embedding")) return false;
  if (id.includes("embed-text") || id.includes("embedding")) return false;

  return true;
}

export function filterChatModels(
  models: LmModel[],
  native: NativeModelInfo[],
): LmModel[] {
  return models.filter((m) => isChatModel(m.id, native));
}
