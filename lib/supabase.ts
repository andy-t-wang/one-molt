// Supabase client configuration
// Provides both anonymous client (for public operations) and admin client (for privileged operations)

import { createClient } from '@supabase/supabase-js'

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Public client (uses anon key, respects RLS policies)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

// Admin client (uses service role key, bypasses RLS)
// Only use in API routes, never expose to client
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null

// Helper to ensure admin client is available
export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available. Missing SUPABASE_SERVICE_ROLE_KEY.')
  }
  return supabaseAdmin
}
