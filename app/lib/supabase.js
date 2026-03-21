import { createClient } from '@supabase/supabase-js'

// Lazy init: don't throw at build time (e.g. Vercel) when env vars are not yet set.
// Client is created on first use; missing env will throw at runtime.
const globalForSupabase = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : {}

/**
 * Supabase Auth traite le 429 (rate limit) sur /token comme erreur "non réessayable" et peut
 * supprimer la session locale. Au retour d’un paiement (nouvel onglet / reload), plusieurs
 * refresh peuvent déclencher ce plafond — on réessaie avec backoff avant de renvoyer la réponse.
 */
function createFetchWith429Retry(baseFetch = globalThis.fetch.bind(globalThis)) {
  return async function fetchWith429Retry(input, init) {
    const urlStr =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : typeof input?.url === 'string'
            ? input.url
            : ''

    const isAuthToken =
      urlStr.includes('/auth/v1/token') || urlStr.includes('/oauth/token')

    const run = () => {
      if (typeof Request !== 'undefined' && input instanceof Request) {
        return baseFetch(input.clone())
      }
      return baseFetch(input, init)
    }

    if (!isAuthToken) {
      return run()
    }

    let backoffMs = 1200
    const maxAttempts = 8
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const res = await run()
      if (res.status !== 429) {
        return res
      }

      let waitMs = backoffMs
      const retryAfter = res.headers.get('Retry-After')
      if (retryAfter) {
        const n = parseInt(retryAfter, 10)
        if (Number.isFinite(n)) {
          waitMs = Math.min(Math.max(n * 1000, 400), 60_000)
        }
      }
      await new Promise((r) => setTimeout(r, waitMs))
      backoffMs = Math.min(backoffMs * 2, 20_000)
    }

    return run()
  }
}

// Réduit les appels internes à getSession / refresh lors des polls (messagerie, panier).
let authHeaderCache = { at: 0, headers: {} }
const AUTH_HEADER_CACHE_MS = 45_000

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
      // Moins de conflits multi-onglets / HMR / retour sur le site après paiement
      lockAcquireTimeout: 20_000,
    },
    global: {
      fetch: createFetchWith429Retry(),
    },
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
  const now = Date.now()
  if (authHeaderCache.headers?.Authorization && now - authHeaderCache.at < AUTH_HEADER_CACHE_MS) {
    return authHeaderCache.headers
  }

  try {
    const {
      data: { session },
      error,
    } = await getSupabaseClient().auth.getSession()

    if (session?.access_token) {
      const headers = { Authorization: `Bearer ${session.access_token}` }
      authHeaderCache = { at: now, headers }
      return headers
    }

    // 429 / erreur transitoire : garder le dernier jeton utilisable quelques secondes
    if (error && authHeaderCache.headers?.Authorization) {
      return authHeaderCache.headers
    }
  } catch {
    if (authHeaderCache.headers?.Authorization) {
      return authHeaderCache.headers
    }
  }

  authHeaderCache = { at: now, headers: {} }
  return {}
}

// Server-side only (service role key) - NEVER use in browser
export const supabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing')
  if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing')
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
