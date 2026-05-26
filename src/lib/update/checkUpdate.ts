import { invoke, isTauri } from "@tauri-apps/api/core";
import { APP_VERSION, UPDATE_CONFIG } from "./config";
import { semverGt } from "./semver";

export interface UpdateCheckResult {
  behindBy: number;
  remoteVersion: string | null;
  localVersion: string;
  isCritical: boolean;
  latestSha: string | null;
  canPull: boolean;
  reason?: string | null;
}

function normalizeResult(raw: {
  behindBy?: number;
  behind_by?: number;
  remoteVersion?: string | null;
  remote_version?: string | null;
  localVersion?: string | null;
  local_version?: string | null;
  isCritical?: boolean;
  is_critical?: boolean;
  latestSha?: string | null;
  latest_sha?: string | null;
  canPull?: boolean;
  can_pull?: boolean;
  reason?: string | null;
}): UpdateCheckResult {
  const remote =
    raw.remoteVersion ?? raw.remote_version ?? null;
  const local =
    raw.localVersion ?? raw.local_version ?? APP_VERSION;
  const behind = raw.behindBy ?? raw.behind_by ?? 0;
  const isCritical =
    raw.isCritical ??
    raw.is_critical ??
    (remote ? semverGt(remote, local) : behind > 0);

  return {
    behindBy: behind,
    remoteVersion: remote,
    localVersion: local,
    isCritical: Boolean(isCritical),
    latestSha: raw.latestSha ?? raw.latest_sha ?? null,
    canPull: raw.canPull ?? raw.can_pull ?? false,
    reason: raw.reason ?? null,
  };
}

async function checkViaTauri(): Promise<UpdateCheckResult> {
  const raw = await invoke<Record<string, unknown>>("check_git_update", {
    branch: UPDATE_CONFIG.defaultBranch,
  });
  return normalizeResult(raw as Parameters<typeof normalizeResult>[0]);
}

async function checkViaDevServer(): Promise<UpdateCheckResult> {
  const res = await fetch("/api/mgo/update/check");
  if (!res.ok) {
    throw new Error(`Update check failed: ${res.status}`);
  }
  const raw = (await res.json()) as Parameters<typeof normalizeResult>[0];
  return normalizeResult(raw);
}

async function checkViaGithubApi(): Promise<UpdateCheckResult> {
  const [owner, repo] = UPDATE_CONFIG.githubRepo.split("/");
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${UPDATE_CONFIG.defaultBranch}/package.json`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return {
      behindBy: 0,
      remoteVersion: null,
      localVersion: APP_VERSION,
      isCritical: false,
      latestSha: null,
      canPull: false,
      reason: "network",
    };
  }
  const pkg = (await res.json()) as { version?: string };
  const remote = pkg.version ?? null;
  const isCritical = remote ? semverGt(remote, APP_VERSION) : false;

  return {
    behindBy: isCritical ? 1 : 0,
    remoteVersion: remote,
    localVersion: APP_VERSION,
    isCritical,
    latestSha: null,
    canPull: false,
    reason: "browser_only",
  };
}

export async function checkForUpdates(): Promise<UpdateCheckResult> {
  if (await isTauri()) {
    return checkViaTauri();
  }
  if (import.meta.env.DEV) {
    try {
      return await checkViaDevServer();
    } catch {
      return checkViaGithubApi();
    }
  }
  return checkViaGithubApi();
}

export async function pullUpdates(): Promise<string> {
  if (await isTauri()) {
    return invoke<string>("pull_git_update", {
      branch: UPDATE_CONFIG.defaultBranch,
    });
  }
  if (import.meta.env.DEV) {
    const res = await fetch("/api/mgo/update/pull", { method: "POST" });
    const data = (await res.json()) as { ok?: boolean; message?: string; error?: string };
    if (!res.ok || !data.ok) {
      throw new Error(data.error ?? data.message ?? "Pull failed");
    }
    return data.message ?? "OK";
  }
  throw new Error("browser_only");
}
