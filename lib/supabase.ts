"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;
const fallbackSupabaseUrl = "https://yzulqnxibgikstzziocz.supabase.co";
const fallbackPublishableKey = "sb_publishable_mI3OhzQL1_-92sUAn91I5Q_bTvVPOaq";

export function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || fallbackSupabaseUrl,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || fallbackPublishableKey
  };
}

export function getBrowserSupabaseClient() {
  const { url, publishableKey } = getSupabaseConfig();

  if (!url || !publishableKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(url, publishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true
      }
    });
  }

  return browserClient;
}
