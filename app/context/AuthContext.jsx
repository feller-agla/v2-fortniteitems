"use client";
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/app/lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const lastProcessedUserId = useRef(null);
  const isSyncing = useRef(false);

  const fetchProfile = async (userId) => {
    if (!userId) return null;
    console.log('[AUTH DEBUG] Fetching profile for:', userId);
    
    // 1. Try Client Fetch (RLS)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (data && data.role) {
        console.log('[AUTH DEBUG] Profile loaded (Client):', data.role);
        return data;
      }
      if (error) console.warn('[AUTH DEBUG] Client fetch warning:', error.message);
    } catch (err) {
      console.warn('[AUTH DEBUG] Client fetch exception:', err);
    }

    // 2. Try API Fetch (Bypass RLS)
    try {
      console.log('[AUTH DEBUG] Falling back to API fetch...');
      const response = await fetch(`/api/auth/profile?userId=${userId}`);
      const result = await response.json();
      
      if (result.data) {
        console.log('[AUTH DEBUG] Profile loaded (API):', result.data.role);
        return result.data;
      }
    } catch (err) {
      console.error('[AUTH DEBUG] API fetch error:', err);
    }

    return { role: 'user' }; // Default fallback
  };

  useEffect(() => {
    let mounted = true;
    let initialSyncDone = false;
    console.log('[AUTH DEBUG] AuthProvider Mounted');

    const syncAuth = async (sessionUser, source = 'unknown') => {
      if (!mounted) return;
      
      const userId = sessionUser?.id || null;
      console.log(`[AUTH DEBUG] Attempting sync from ${source}. UserID: ${userId || 'null'}`);

      // If we already have this user and we're ready, ignore redundant signals
      if (userId === lastProcessedUserId.current && isAuthReady && initialSyncDone) {
        return;
      }

      // Prevent concurrent syncs for the same user state
      if (isSyncing.current && userId === lastProcessedUserId.current) {
        return;
      }

      isSyncing.current = true;
      lastProcessedUserId.current = userId;

      try {
        if (sessionUser) {
          // We have a user! Set them immediately to prevent redirects
          setUser(sessionUser);
          const userProfile = await fetchProfile(sessionUser.id);
          if (mounted) {
            setProfile(userProfile);
            console.log('[AUTH DEBUG] User & Profile synced. (Source:', source, ')');
          }
        } else {
          // IMPORTANT: a null session can be transient (network hiccup / token refresh race).
          // Only clear user state on an explicit SIGNED_OUT event.
          const isExplicitSignOut = source === 'EVENT:SIGNED_OUT';
          if (isExplicitSignOut) {
            setUser(null);
            setProfile(null);
            console.log('[AUTH DEBUG] Signed out. (Source:', source, ')');
          } else {
            // Keep current user/profile to avoid redirect loops.
            console.log('[AUTH DEBUG] No session (transient). Keeping previous auth state. (Source:', source, ')');
          }
        }
      } catch (err) {
        console.error('[AUTH DEBUG] Sync error:', err);
      } finally {
        if (mounted) {
          initialSyncDone = true;
          setIsAuthReady(true);
          isSyncing.current = false;
        }
      }
    };

    // 1. Unified initialization
    const getSessionWithGrace = async () => {
      for (let attempt = 0; attempt < 4; attempt++) {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session?.user) return session;
        const msg = (error?.message || '').toLowerCase();
        const rateLimited = error?.status === 429 || msg.includes('rate limit');
        if (rateLimited && attempt < 3) {
          console.warn(`[AUTH DEBUG] Session indisponible (rate limit?), nouvel essai ${attempt + 2}/4…`);
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
          continue;
        }
        return session ?? null;
      }
      return null;
    };

    const initializeAuth = async () => {
      try {
        // Après paiement / changement d’onglet, un 429 sur /token peut renvoyer null une fois — on réessaie.
        const session = await getSessionWithGrace();
        await syncAuth(session?.user ?? null, 'INITIAL_GET_SESSION');

        // Then, listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log(`[AUTH DEBUG] onAuthStateChange: ${event}`, { hasUser: !!session?.user });
          
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
            syncAuth(session?.user ?? null, `EVENT:${event}`);
          } else if (event === 'SIGNED_OUT') {
            syncAuth(null, 'EVENT:SIGNED_OUT');
          }
          // Note: We ignore INITIAL_SESSION event here because we did getSession above
        });

        return subscription;
      } catch (err) {
        console.error('[AUTH DEBUG] Init error:', err);
        if (mounted) setIsAuthReady(true);
        return null;
      }
    };

    const authSubscriptionPromise = initializeAuth();

    // 10s Safety Timeout in case Supabase hangs
    const timer = setTimeout(() => {
      if (mounted && !isAuthReady) {
        console.warn('[AUTH DEBUG] 10s Safety Timeout! Releasing app handle.');
        setIsAuthReady(true);
      }
    }, 10000);

    return () => {
      mounted = false;
      clearTimeout(timer);
      authSubscriptionPromise.then(sub => sub?.unsubscribe());
    };
  }, []);

  // Real-time listener for profile changes (role updates, etc)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`profile-${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, (payload) => {
        console.log('[AUTH DEBUG] Real-time Profile update:', payload.new?.role);
        setProfile(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });

  const signInWithEmail = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    setUser(null);
    setProfile(null);
    setIsAuthReady(true);
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const isAdmin = profile?.role === 'admin';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const displayName = profile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Joueur';

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading: !isAuthReady,
      isAuthReady,
      avatarUrl,
      displayName,
      signInWithGoogle,
      signInWithEmail,
      signUp,
      signOut,
      isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
