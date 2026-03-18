import { createClient } from '@supabase/supabase-js'

// Lazy init: don't throw at build time (e.g. Vercel) when env vars are not yet set.
// Client is created on first use; missing env will throw at runtime.
const globalForSupabase = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : {}

function getSupabaseClient() {
  if (globalForSupabase.supabaseInstance) return globalForSupabase.supabaseInstance
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    const isVercel = typeof window !== 'undefined' && window.location.hostname?.includes('vercel')
    throw new Error(
      'Supabase: variables manquantes. ' +
      (isVercel
        ? 'Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans Vercel → Settings → Environment Variables, puis redéployez.'
        : 'Vérifiez que .env.local contient NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY, puis redémarrez "npm run dev".')
    )
  }
  globalForSupabase.supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    }
  })
  return globalForSupabase.supabaseInstance
}

// Proxy so "supabase.from(...)" etc. works; client is created on first property access.
export const supabase = new Proxy(
  {},
  {
    get(_, prop) {
      return getSupabaseClient()[prop]
    },
  }
)

/** Client-only: get headers with Bearer token for API routes that need auth. */
export async function getAuthHeaders() {
  try {
    const { data: { session } } = await getSupabaseClient().auth.getSession()
    if (session?.access_token) return { Authorization: `Bearer ${session.access_token}` }
  } catch (_) {}
  return {}
}

// Server-side only (service role key) - NEVER use in browser
export const supabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing')
  if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing')
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}
