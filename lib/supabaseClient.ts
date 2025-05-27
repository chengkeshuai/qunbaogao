import { createClient } from '@supabase/supabase-js'

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

let supabaseAdmin: any; // Define type if known, e.g., SupabaseClient

if (supabaseServiceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      // It's generally recommended to disable auto-refreshing session for server-side clients
      // if you're not using user-specific RLS policies that depend on the session.
      autoRefreshToken: false,
      persistSession: false,
      // detectSessionInUrl: false, // Deprecated in newer versions
    }
  });
} else {
  console.warn("SUPABASE_SERVICE_ROLE_KEY is not set. Admin operations will not be available.")
  // Fallback or restricted client if needed, or simply don't initialize admin client.
  // For now, we'll allow supabaseAdmin to be undefined if the key is missing.
}

export { supabaseAdmin };

// Helper function to get the admin client, ensuring it's initialized
export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
       throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set. Cannot perform admin operations.");
    }
    // This case should ideally not be reached if the initial check for supabaseServiceRoleKey is done correctly.
    // Re-initialize if it was missed, though this suggests a logic flaw elsewhere.
    supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        }
    });
  }
  return supabaseAdmin;
} 