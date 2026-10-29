import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService, AuthResponse } from '../services/authService';
import { storageService } from '../services/storageService';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isSigningOut: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  handleSessionExpired: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);
  const isSigningOutRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT' || !currentSession) {
        storageService.clearCache();
        setSession(null);
        setUser(null);
        setLoading(false);
        isSigningOutRef.current = false;
        setIsSigningOut(false);
        return;
      }

      setSession(currentSession);
      setUser(currentSession.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await authService.signIn(email, password);
    if (res.session) {
      setSession(res.session);
      setUser(res.user);
    }
    return res;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const res = await authService.signUp(email, password);
    if (res.session) {
      setSession(res.session);
      setUser(res.user);
    }
    return res;
  }, []);

  const signOut = useCallback(async () => {
    isSigningOutRef.current = true;
    setIsSigningOut(true);

    storageService.clearCache();
    setSession(null);
    setUser(null);

    try {
      await authService.signOut();
    } catch {
      // Intentionally swallowed on signout
    } finally {
      isSigningOutRef.current = false;
      setIsSigningOut(false);
    }
  }, []);

  const handleSessionExpired = useCallback(async () => {
    await signOut();
  }, [signOut]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        isSigningOut,
        signIn,
        signUp,
        signOut,
        handleSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
