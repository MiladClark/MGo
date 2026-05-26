/** Vite dev proxy path — same-origin, avoids CORS from localhost:1420 → :1234 */
export const LM_STUDIO_DEV_PROXY = "/api/lmstudio/v1";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

/** True when URL targets local LM Studio OpenAI server (default port 1234). */
export function isLocalLmStudioUrl(url: string): boolean {
  try {
    const u = new URL(normalizeBaseUrl(url));
    const host = u.hostname === "127.0.0.1" || u.hostname === "localhost";
    const port = u.port === "1234" || u.port === "";
    const path = u.pathname === "/v1" || u.pathname.endsWith("/v1");
    return host && port && path;
  } catch {
    return false;
  }
}

/**
 * In Vite dev (npm run dev / tauri dev), route LM Studio calls through the dev proxy.
 * Production Tauri build talks to LM Studio directly (no browser CORS).
 */
export function resolveApiBase(configBaseUrl: string): string {
  const normalized = normalizeBaseUrl(configBaseUrl);
  if (import.meta.env.DEV && isLocalLmStudioUrl(normalized)) {
    return LM_STUDIO_DEV_PROXY;
  }
  return normalized;
}
