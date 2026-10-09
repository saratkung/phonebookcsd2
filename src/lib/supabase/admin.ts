import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { supabaseServiceRoleKey, supabaseUrl } from "./env";

// Service-role client: bypasses RLS entirely. Used ONLY by trusted
// server-side admin operations (creating/deactivating auth users). Never
// import this from a Client Component, and never expose
// SUPABASE_SERVICE_ROLE_KEY to the browser.
export function createAdminClient() {
  return createSupabaseClient<Database>(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
