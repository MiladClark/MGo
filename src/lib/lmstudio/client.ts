import { mergeSystemPrompt } from "@/lib/persian";
import type {
  ApiChatMessage,
  ChatCompletionChunk,
  ConnectionConfig,
  InferenceConfig,
  ModelsResponse,
} from "./types";
import { resolveApiBase } from "./resolveUrl";

function headers(config: ConnectionConfig): HeadersInit {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.apiKey.trim()) {
    h.Authorization = `Bearer ${config.apiKey.trim()}`;
  }
  return h;
}

export class LmStudioError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "LmStudioError";
  }
}

export async function listModels(
  config: ConnectionConfig,
  signal?: AbortSignal,
): Promise<ModelsResponse> {
  const base = resolveApiBase(config.baseUrl);
  try {
    const res = await fetch(`${base}/models`, {
      headers: headers(config),
      signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new LmStudioError(
        `HTTP ${res.status}: ${text || res.statusText}`,
      );
    }
    return (await res.json()) as ModelsResponse;
  } catch (err) {
    if (err instanceof LmStudioError) throw err;
    throw new LmStudioError(formatFetchError(err), err);
  }
}

function formatFetchError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("Load failed")
  ) {
    return import.meta.env.DEV
      ? "Network/CORS — ensure LM Studio server is running on port 1234"
      : "Cannot reach LM Studio — start Developer → Server in LM Studio";
  }
  return msg;
}

export interface ConnectionTestResult {
  ok: boolean;
  error?: string;
  modelCount?: number;
}

export async function testConnection(
  config: ConnectionConfig,
  signal?: AbortSignal,
): Promise<ConnectionTestResult> {
  try {
    const data = await listModels(config, signal);
    const count = data.data?.length ?? 0;
    return { ok: Array.isArray(data.data), modelCount: count };
  } catch (err) {
    const message =
      err instanceof LmStudioError
        ? err.message
        : formatFetchError(err);
    return { ok: false, error: message };
  }
}

export interface StreamHandlers {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export async function chatStream(
  config: ConnectionConfig,
  inference: InferenceConfig,
  model: string,
  messages: ApiChatMessage[],
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const base = resolveApiBase(config.baseUrl);
  const payloadMessages: ApiChatMessage[] = [...messages];
  const systemText = mergeSystemPrompt(inference.systemPrompt);
  const hasSystem = payloadMessages.some((m) => m.role === "system");
  if (!hasSystem) {
    payloadMessages.unshift({ role: "system", content: systemText });
  }

  const body = {
    model,
    messages: payloadMessages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    temperature: inference.temperature,
    max_tokens: inference.maxTokens,
    top_p: inference.topP,
    stream: true,
  };

  let res: Response;
  try {
    res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: headers(config),
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (signal?.aborted) return;
    handlers.onError(
      new LmStudioError(formatFetchError(err), err),
    );
    return;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    handlers.onError(
      new LmStudioError(`HTTP ${res.status}: ${text || res.statusText}`),
    );
    return;
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/event-stream") && !res.body) {
    try {
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = json.choices?.[0]?.message?.content ?? "";
      if (content) handlers.onDelta(content);
      handlers.onDone();
    } catch (err) {
      handlers.onError(
        err instanceof Error ? err : new LmStudioError(String(err)),
      );
    }
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    handlers.onError(new LmStudioError("No response body"));
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":")) continue;
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") {
          handlers.onDone();
          return;
        }
        try {
          const chunk = JSON.parse(data) as ChatCompletionChunk;
          if (chunk.error?.message) {
            handlers.onError(new LmStudioError(chunk.error.message));
            return;
          }
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) handlers.onDelta(delta);
        } catch {
          /* skip malformed SSE chunks */
        }
      }
    }
    handlers.onDone();
  } catch (err) {
    if (signal?.aborted) return;
    handlers.onError(
      err instanceof Error ? err : new LmStudioError(String(err)),
    );
  } finally {
    reader.releaseLock();
  }
}
