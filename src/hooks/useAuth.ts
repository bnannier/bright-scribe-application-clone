import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const AUTH_CACHE_KEY = 'brightscribe_auth_cache';
const AUTH_TIMEOUT = 10000; // 10 seconds

interface AuthCache {
  user: User | null;
  session: Session | null;
  timestamp: number;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  // Cache management functions
  const saveAuthCache = (user: User | null, session: Session | null) => {
    const cache: AuthCache = {
      user,
      session,
      timestamp: Date.now()
    };
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cache));
  };

  const loadAuthCache = (): AuthCache | null => {
    try {
      const cached = localStorage.getItem(AUTH_CACHE_KEY);
      if (!cached) return null;
      
      const cache: AuthCache = JSON.parse(cached);
      // Cache expires after 24 hours
      if (Date.now() - cache.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(AUTH_CACHE_KEY);
        return null;
      }
      return cache;
    } catch {
      return null;
    }
  };

  const clearAuthCache = () => {
    localStorage.removeItem(AUTH_CACHE_KEY);
  };

  useEffect(() => {
    console.log('🔐 Auth hook initializing...');
    
    // Initialize online status
    setIsOnline(navigator.onLine);
    
    // Handle online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load cached auth state for immediate offline access
    const cachedAuth = loadAuthCache();
    if (cachedAuth) {
      console.log('🔐 Loading cached auth state');
      setUser(cachedAuth.user);
      setSession(cachedAuth.session);
      // Don't set loading to false yet if we're online - wait for server check
      if (!navigator.onLine) {
        setLoading(false);
        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
      }
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Cache the auth state
        saveAuthCache(session?.user ?? null, session);
        
        if (event === 'SIGNED_OUT') {
          clearAuthCache();
        }
      }
    );

    // Check for existing session with timeout (only when online)
    if (navigator.onLine) {
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), AUTH_TIMEOUT)
      );

      Promise.race([sessionPromise, timeoutPromise])
        .then((result: any) => {
          const { data: { session }, error } = result;
          if (error) {
            console.error('🔐 Error getting session:', error);
          } else {
            console.log('🔐 Initial session check:', session?.user?.email);
          }
          setSession(session);
          setUser(session?.user ?? null);
          saveAuthCache(session?.user ?? null, session);
          setLoading(false);
        })
        .catch((error) => {
          console.warn('🔐 Session check timed out or failed:', error);
          // Fall back to cached auth if available
          if (cachedAuth) {
            console.log('🔐 Falling back to cached auth state');
            setUser(cachedAuth.user);
            setSession(cachedAuth.session);
          }
          setLoading(false);
        });
    } else {
      // If offline and no cache, still finish loading
      if (!cachedAuth) {
        setLoading(false);
      }
    }

    return () => {
      console.log('🔐 Auth hook cleanup');
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signInWithProvider = async (provider: 'google' | 'github' | 'twitter' | 'facebook') => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    return { error };
  };

  return {
    user,
    session,
    loading,
    isOnline,
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    resetPassword
  };
};