"use client";

import type { UserProgress } from "@/lib/types";
import { scopedStorageKey } from "@/lib/userStorage";

export const progressKey = "mbe-glass-progress-v1";

export const emptyProgress: UserProgress = {
  attempts: [],
  questionStats: {},
  savedQuestionIds: []
};

export function readStorage(): UserProgress {
  if (typeof window === "undefined") {
    return emptyProgress;
  }

  try {
    const stored = window.localStorage.getItem(scopedStorageKey(progressKey));
    return stored ? { ...emptyProgress, ...JSON.parse(stored) } : emptyProgress;
  } catch {
    return emptyProgress;
  }
}

export function writeStorage(progress: UserProgress, options: { syncCloud?: boolean } = {}) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(scopedStorageKey(progressKey), JSON.stringify(progress));
  window.dispatchEvent(new Event("mbe-progress-updated"));

  if (options.syncCloud !== false) {
    void import("@/lib/cloudProgress").then(({ saveQuestionProgressToCloud }) => {
      void saveQuestionProgressToCloud(progress);
    });
  }
}

export function clearStorage() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(scopedStorageKey(progressKey));
  window.dispatchEvent(new Event("mbe-progress-updated"));
  void import("@/lib/cloudProgress").then(({ clearQuestionProgressFromCloud }) => {
    void clearQuestionProgressFromCloud();
  });
}
