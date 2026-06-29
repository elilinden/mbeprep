"use client";

import { getBrowserSupabaseClient } from "@/lib/supabase";

export type SuggestionPayload = {
  type: string;
  message: string;
  page?: string;
};

export async function submitSuggestion(payload: SuggestionPayload) {
  const supabase = getBrowserSupabaseClient();

  if (!supabase) {
    throw new Error("Suggestions are not connected yet.");
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Please sign in before sending a suggestion.");
  }

  const { error } = await supabase.from("suggestions").insert({
    user_id: userData.user.id,
    email: userData.user.email,
    type: payload.type,
    message: payload.message.trim(),
    page: payload.page?.trim() || null
  });

  if (error) {
    if (error.code === "42P01") {
      throw new Error("Suggestions table is not set up yet. Run the Supabase SQL setup file first.");
    }

    throw new Error(error.message);
  }
}
