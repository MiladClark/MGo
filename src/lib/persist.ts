import { isTauri } from "@tauri-apps/api/core";

const STORE_PATH = "mgo-store.json";
const LS_PREFIX = "mgo:";

function loadFromLocalStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`${LS_PREFIX}${key}`);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    /* ignore */
  }
  return null;
}

function saveToLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${LS_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

let storePromise: Promise<import("@tauri-apps/plugin-store").Store> | null =
  null;

async function getTauriStore() {
  if (!storePromise) {
    const { load } = await import("@tauri-apps/plugin-store");
    storePromise = load(STORE_PATH, { autoSave: true, defaults: {} });
  }
  return storePromise;
}

export async function loadPersisted<T>(key: string): Promise<T | null> {
  if (!isTauri()) {
    return loadFromLocalStorage<T>(key);
  }
  try {
    const store = await getTauriStore();
    const value = await store.get<T>(key);
    return value ?? null;
  } catch {
    return loadFromLocalStorage<T>(key);
  }
}

export async function savePersisted<T>(key: string, value: T): Promise<void> {
  if (!isTauri()) {
    saveToLocalStorage(key, value);
    return;
  }
  try {
    const store = await getTauriStore();
    await store.set(key, value);
    await store.save();
  } catch {
    saveToLocalStorage(key, value);
  }
}

/** @deprecated Use loadPersisted — kept for compatibility */
export async function loadPersistedFallback<T>(key: string): Promise<T | null> {
  return loadPersisted<T>(key);
}
