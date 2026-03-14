import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase ENV variables missing. Check .env.local file.')
}

// Singleton pattern — prevents multiple instances causing lock conflicts
// Use a global variable to persist the client across HMR reloads
const globalSupabase = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : {};

if (!globalSupabase.supabaseInstance) {
  globalSupabase.supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    }
  });
}

export const supabase = globalSupabase.supabaseInstance;

// Server-side only (service role key) - NEVER use in browser
export const supabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing')
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}
