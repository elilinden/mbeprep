"use client";

export type LocalAccount = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastSignedInAt: string;
};

export const authChangedEvent = "mbe-auth-changed";
const accountsKey = "mbe-prep-local-accounts-v1";
const currentUserIdKey = "mbe-prep-current-user-id";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function readAccounts(): LocalAccount[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(accountsKey);
    return stored ? JSON.parse(stored) as LocalAccount[] : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: LocalAccount[]) {
  window.localStorage.setItem(accountsKey, JSON.stringify(accounts));
}

function notifyAuthChanged() {
  window.dispatchEvent(new Event(authChangedEvent));
}

export function getCurrentAccount() {
  if (typeof window === "undefined") {
    return null;
  }

  const currentId = window.localStorage.getItem(currentUserIdKey);
  if (!currentId) {
    return null;
  }

  return readAccounts().find((account) => account.id === currentId) || null;
}

export function createLocalAccount({ email, name }: { email: string; name: string }) {
  const cleanEmail = normalizeEmail(email);
  const cleanName = name.trim() || cleanEmail.split("@")[0] || "Student";

  if (!cleanEmail.includes("@")) {
    throw new Error("Enter a valid email address.");
  }

  const accounts = readAccounts();
  const existing = accounts.find((account) => account.email === cleanEmail);
  const now = new Date().toISOString();

  if (existing) {
    const updated = { ...existing, name: cleanName || existing.name, lastSignedInAt: now };
    writeAccounts(accounts.map((account) => account.id === existing.id ? updated : account));
    window.localStorage.setItem(currentUserIdKey, updated.id);
    notifyAuthChanged();
    return updated;
  }

  const account: LocalAccount = {
    id: crypto.randomUUID(),
    email: cleanEmail,
    name: cleanName,
    createdAt: now,
    lastSignedInAt: now
  };

  writeAccounts([...accounts, account]);
  window.localStorage.setItem(currentUserIdKey, account.id);
  notifyAuthChanged();
  return account;
}

export function signInLocalAccount(email: string) {
  const cleanEmail = normalizeEmail(email);
  const accounts = readAccounts();
  const account = accounts.find((item) => item.email === cleanEmail);

  if (!account) {
    throw new Error("No account found for that email. Create one first.");
  }

  const updated = { ...account, lastSignedInAt: new Date().toISOString() };
  writeAccounts(accounts.map((item) => item.id === updated.id ? updated : item));
  window.localStorage.setItem(currentUserIdKey, updated.id);
  notifyAuthChanged();
  return updated;
}

export function signOutLocalAccount() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(currentUserIdKey);
  notifyAuthChanged();
}
