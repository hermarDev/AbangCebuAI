"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/env/public";

export function createBrowserSupabaseClient() {
  const { url, key } = getSupabaseConfig();
  return createBrowserClient(url, key);
}
