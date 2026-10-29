import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getFriendlyErrorMessage } from '../utils/errors';

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: string | null;
}

export const authService = {
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        return {
          user: null,
          session: null,
          error: getFriendlyErrorMessage(error),
        };
      }

      return {
        user: data.user,
        session: data.session,
        error: null,
      };
    } catch (err) {
      return {
        user: null,
        session: null,
        error: getFriendlyErrorMessage(err),
      };
    }
  },

  async signUp(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        return {
          user: null,
          session: null,
          error: getFriendlyErrorMessage(error),
        };
      }

      return {
        user: data.user,
        session: data.session,
        error: null,
      };
    } catch (err) {
      return {
        user: null,
        session: null,
        error: getFriendlyErrorMessage(err),
      };
    }
  },

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      if (__DEV__) {
        console.warn('[SignOut Error]:', err);
      }
    }
  },

  async getSession(): Promise<{ session: Session | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        return { session: null, error: getFriendlyErrorMessage(error) };
      }
      return { session: data.session, error: null };
    } catch (err) {
      return { session: null, error: getFriendlyErrorMessage(err) };
    }
  },
};
