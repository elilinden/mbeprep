const currentUserIdKey = "mbe-prep-current-user-id";

export function getCurrentUserId() {
  if (typeof window === "undefined") {
    return "server";
  }

  const authUserId = window.localStorage.getItem(currentUserIdKey);
  if (authUserId) {
    return authUserId;
  }

  return "signed-out";
}

export function scopedStorageKey(baseKey: string) {
  return `${baseKey}:${getCurrentUserId()}`;
}

export function readJsonStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) as T : fallback;
  } catch {
    return fallback;
  }
}

export function writeJsonStorage<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}
