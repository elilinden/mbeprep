"use client";

import { getBrowserSupabaseClient } from "@/lib/supabase";

export type Account = {
  id: string;
  email: string;
  name: string;
};

export type SignUpResult = {
  account: Account | null;
  needsEmailConfirmation: boolean;
};

export const authChangedEvent = "mbe-auth-changed";
const currentUserIdKey = "mbe-prep-current-user-id";

function notifyAuthChanged() {
  window.dispatchEvent(new Event(authChangedEvent));
}

function accountFromUser(user: {
  id: string;
  email?: string;
  user_metadata?: { name?: unknown; full_name?: unknown };
}): Account {
  const email = user.email || "";
  const rawName = user.user_metadata?.name || user.user_metadata?.full_name;
  const name = typeof rawName === "string" && rawName.trim() ? rawName.trim() : email.split("@")[0] || "Student";

  return {
    id: user.id,
    email,
    name
  };
}

function rememberUserId(account: Account | null) {
  if (account) {
    window.localStorage.setItem(currentUserIdKey, account.id);
  } else {
    window.localStorage.removeItem(currentUserIdKey);
  }
}

function requireSupabase() {
  const supabase = getBrowserSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel.");
  }

  return supabase;
}

export async function getCurrentAccount() {
  const supabase = getBrowserSupabaseClient();

  if (!supabase) {
    rememberUserId(null);
    return null;
  }

  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session?.user) {
    rememberUserId(null);
    return null;
  }

  const account = accountFromUser(data.session.user);
  rememberUserId(account);
  return account;
}

export async function createAccount({
  email,
  password,
  name
}: {
  email: string;
  password: string;
  name: string;
}): Promise<SignUpResult> {
  const supabase = requireSupabase();
  const cleanName = name.trim() || email.split("@")[0] || "Student";
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        name: cleanName,
        full_name: cleanName
      },
      emailRedirectTo: window.location.origin
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  const account = data.user ? accountFromUser(data.user) : null;
  const signedIn = Boolean(data.session && account);
  rememberUserId(signedIn ? account : null);
  notifyAuthChanged();

  return {
    account: signedIn ? account : null,
    needsEmailConfirmation: !signedIn
  };
}

export async function signInAccount({ email, password }: { email: string; password: string }) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("Unable to sign in.");
  }

  const account = accountFromUser(data.user);
  rememberUserId(account);
  notifyAuthChanged();
  return account;
}

export async function signOutAccount() {
  const supabase = getBrowserSupabaseClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  rememberUserId(null);
  notifyAuthChanged();
}
