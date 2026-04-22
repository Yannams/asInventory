import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

declare global {
  var __asukaSupabaseClient__: SupabaseClient | undefined;
}

function createSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

export const supabase =
  globalThis.__asukaSupabaseClient__ ??
  createSupabaseBrowserClient() ??
  null;

if (supabase) {
  globalThis.__asukaSupabaseClient__ = supabase;
}
