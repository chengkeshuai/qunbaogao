import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL")
}
if (!supabaseAnonKey) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY")
}
// Service role key is not strictly required for all client-side operations
// but will be needed for admin/server-side operations.
// We'll create two clients: one for client-side use with anon key,
// and one for server-side use with service_role key if available.

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Singleton instance for admin client, created on first request
let supabaseAdminInstance: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }

  if (!supabaseServiceRoleKey) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is not set. Cannot create admin client.");
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured on the server.");
  }
  
  if (!supabaseUrl) { // Should be caught by earlier check, but defensive
    throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL for admin client creation.");
  }

  supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
  
  return supabaseAdminInstance;
}

// Optional: If you still want to export a potentially null admin client for some reason (not recommended for direct use in APIs)
// export const supabaseAdmin = supabaseAdminInstance; // This would always be null initially 