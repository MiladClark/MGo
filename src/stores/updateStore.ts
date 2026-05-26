import { create } from "zustand";
import {
  checkForUpdates,
  pullUpdates,
  type UpdateCheckResult,
} from "@/lib/update/checkUpdate";

const DISMISS_KEY = "mgo:update:dismissed-sha";

type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "pulling"
  | "success"
  | "error";

interface UpdateState {
  status: UpdateStatus;
  result: UpdateCheckResult | null;
  error: string | null;
  dismissed: boolean;
  checkUpdate: () => Promise<void>;
  applyUpdate: () => Promise<void>;
  dismissBanner: () => void;
  clearDismiss: () => void;
}

function isDismissed(sha: string | null): boolean {
  if (!sha) return false;
  try {
    return localStorage.getItem(DISMISS_KEY) === sha;
  } catch {
    return false;
  }
}

function setDismissed(sha: string | null) {
  if (!sha) return;
  try {
    localStorage.setItem(DISMISS_KEY, sha);
  } catch {
    /* ignore */
  }
}

export const useUpdateStore = create<UpdateState>((set, get) => ({
  status: "idle",
  result: null,
  error: null,
  dismissed: false,

  checkUpdate: async () => {
    set({ status: "checking", error: null });
    try {
      const result = await checkForUpdates();
      const hasUpdate =
        result.behindBy > 0 ||
        (result.remoteVersion !== null &&
          result.remoteVersion !== result.localVersion);

      const dismissed = isDismissed(
        result.latestSha ?? result.remoteVersion,
      );

      set({
        result,
        dismissed,
        status: hasUpdate && !dismissed ? "available" : "idle",
        error: null,
      });
    } catch (e) {
      set({
        status: "error",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  applyUpdate: async () => {
    const { result } = get();
    if (!result?.canPull && result?.reason === "browser_only") {
      set({ status: "error", error: "browser_only" });
      return;
    }

    set({ status: "pulling", error: null });
    try {
      await pullUpdates();
      get().clearDismiss();
      set({ status: "success", error: null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ status: "error", error: msg });
    }
  },

  dismissBanner: () => {
    const sha = get().result?.latestSha ?? get().result?.remoteVersion ?? null;
    setDismissed(sha);
    set({ dismissed: true, status: "idle" });
  },

  clearDismiss: () => {
    try {
      localStorage.removeItem(DISMISS_KEY);
    } catch {
      /* ignore */
    }
    set({ dismissed: false });
  },
}));
