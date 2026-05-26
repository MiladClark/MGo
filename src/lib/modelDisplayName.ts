interface ParsedModelId {
  publisher: string;
  slug: string;
}

interface ModelFamily {
  brand: string;
  patterns: RegExp[];
  strip: RegExp[];
}

const MODEL_FAMILIES: ModelFamily[] = [
  {
    brand: "Gemini",
    patterns: [/gemini/i],
    strip: [/^gemini-?/i],
  },
  {
    brand: "Gemma",
    patterns: [/gemma/i],
    strip: [/^gemma-?/i],
  },
  {
    brand: "GPT",
    patterns: [/gpt-oss/i, /\bgpt/i, /\bo[134](?:-mini|-preview)?\b/i],
    strip: [/^gpt-oss-?/i, /^gpt-?/i, /^o([134])(?:-mini|-preview)?-?/i],
  },
  {
    brand: "Llama",
    patterns: [/llama/i],
    strip: [/^llama-?/i, /^llama3-?/i],
  },
  {
    brand: "Mistral",
    patterns: [/mixtral/i, /codestral/i, /mistral/i],
    strip: [/^mixtral-?/i, /^codestral-?/i, /^mistral-?/i],
  },
  {
    brand: "Qwen",
    patterns: [/qwen/i],
    strip: [/^qwen-?/i],
  },
  {
    brand: "DeepSeek",
    patterns: [/deepseek/i],
    strip: [/^deepseek-?/i],
  },
  {
    brand: "Phi",
    patterns: [/\bphi-?\d/i, /\bphi\b/i],
    strip: [/^phi-?/i],
  },
  {
    brand: "Claude",
    patterns: [/claude/i],
    strip: [/^claude-?/i],
  },
  {
    brand: "Command",
    patterns: [/command/i],
    strip: [/^command-?/i],
  },
  {
    brand: "Granite",
    patterns: [/granite/i],
    strip: [/^granite-?/i],
  },
  {
    brand: "Vicuna",
    patterns: [/vicuna/i],
    strip: [/^vicuna-?/i],
  },
  {
    brand: "Falcon",
    patterns: [/falcon/i],
    strip: [/^falcon-?/i],
  },
  {
    brand: "Solar",
    patterns: [/solar/i],
    strip: [/^solar-?/i],
  },
  {
    brand: "Yi",
    patterns: [/\byi-/i, /^yi\d/i],
    strip: [/^yi-?/i],
  },
  {
    brand: "Nemotron",
    patterns: [/nemotron/i],
    strip: [/^nemotron-?/i],
  },
  {
    brand: "TinyLlama",
    patterns: [/tinyllama/i],
    strip: [/^tinyllama-?/i],
  },
  {
    brand: "Orca",
    patterns: [/orca/i],
    strip: [/^orca-?/i],
  },
];

/** Technical tokens omitted from UI labels (sizes, quant tags, run variants). */
const SKIP_TOKENS = new Set([
  "oss",
  "instruct",
  "instruction",
  "flash",
  "exp",
  "experimental",
  "preview",
  "chat",
  "coder",
  "code",
  "vision",
  "turbo",
  "pro",
  "mini",
  "nano",
  "ultra",
  "max",
  "sonnet",
  "haiku",
  "opus",
  "vl",
  "thinking",
  "it",
  "awq",
  "gptq",
  "gguf",
  "q4",
  "q5",
  "q6",
  "q8",
  "k",
  "m",
  "s",
  "bf16",
  "fp16",
]);

const MODEL_LINE_CODES: Record<string, string> = {
  r1: "R1",
  v2: "V2",
  v3: "V3",
  v4: "V4",
};

function parseModelId(modelId: string): ParsedModelId {
  const base = modelId.trim().split("@")[0] ?? "";
  const slash = base.indexOf("/");
  if (slash < 0) {
    return { publisher: "", slug: base.toLowerCase() };
  }
  return {
    publisher: base.slice(0, slash).toLowerCase(),
    slug: base.slice(slash + 1).toLowerCase(),
  };
}

function detectFamily(slug: string): ModelFamily | undefined {
  return MODEL_FAMILIES.find((family) =>
    family.patterns.some((pattern) => pattern.test(slug)),
  );
}

function stripFamilyPrefix(slug: string, family: ModelFamily): string {
  if (family.brand === "GPT" && /gpt-oss/i.test(slug)) {
    return slug.replace(/^gpt-?/i, "").replace(/^-+/, "");
  }

  let rest = slug;
  for (const pattern of family.strip) {
    if (pattern.test(rest)) {
      rest = rest.replace(pattern, "");
      break;
    }
  }
  return rest.replace(/^-+/, "");
}

function isSkippedToken(token: string): boolean {
  const t = token.toLowerCase();
  if (!t) return true;
  if (/^\d+(\.\d+)?b$/i.test(t)) return true;
  if (SKIP_TOKENS.has(t)) return true;
  if (/^q\d/i.test(t)) return true;
  if (/^\d+bit$/i.test(t)) return true;
  return false;
}

function parseVersionToken(token: string): string | null {
  const t = token.trim().toLowerCase();
  if (!t || isSkippedToken(t)) return null;

  const qwenVersion = /^qwen2\.?5$/i.exec(t);
  if (qwenVersion) return "2.5";

  if (/^\d+(\.\d+)?$/.test(t)) return t;

  if (/^v(\d+(?:\.\d+)?)$/i.test(t)) {
    return `V${t.slice(1)}`;
  }

  if (MODEL_LINE_CODES[t]) return MODEL_LINE_CODES[t];

  return null;
}

function buildVersionSegments(rest: string): string[] {
  const versions: string[] = [];
  for (const token of rest.split("-").filter(Boolean)) {
    const parsed = parseVersionToken(token);
    if (parsed) versions.push(parsed);
  }
  return versions;
}

function humanizeSlug(slug: string): string {
  const parts: string[] = [];
  for (const token of slug.split("-").filter(Boolean)) {
    if (isSkippedToken(token)) continue;
    const parsed = parseVersionToken(token);
    if (parsed) {
      parts.push(parsed);
      continue;
    }
    parts.push(token.charAt(0).toUpperCase() + token.slice(1));
  }
  return parts.join(" ");
}

function joinDisplayName(brand: string, versions: string[]): string {
  const versionStr = versions.join(" ");
  return versionStr ? `${brand} ${versionStr}` : brand;
}

/** Friendly label for LM Studio model IDs (API id unchanged). */
export function formatModelDisplayName(modelId: string): string {
  const id = modelId.trim();
  if (!id) return id;

  const { slug } = parseModelId(id);
  if (!slug) return id;

  const family = detectFamily(slug);
  if (!family) {
    const humanized = humanizeSlug(slug);
    return humanized || id;
  }

  const rest = stripFamilyPrefix(slug, family);
  if (!rest) return family.brand;

  const versions = buildVersionSegments(rest);
  return joinDisplayName(family.brand, versions);
}

/** Tooltip: friendly name + technical id */
export function getModelDisplayTitle(modelId: string): string {
  const label = formatModelDisplayName(modelId);
  const base = modelId.trim().split("@")[0];
  if (label === base || label === modelId) return modelId;
  return `${label} (${base})`;
}

export function getModelLabel(
  model: string | { id: string; displayName?: string },
): string {
  if (typeof model === "string") {
    return formatModelDisplayName(model);
  }
  return model.displayName ?? formatModelDisplayName(model.id);
}
