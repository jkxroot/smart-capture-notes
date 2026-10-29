import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getFriendlyErrorMessage } from '../utils/errors';

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: string | null;
}

export const authService = {
  /**
   * Signs in user with email and password
   */
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

  /**
   * Signs up a new user with email and password
   */
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

  /**
   * Signs out the current user and clears session
   */
  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { error: getFriendlyErrorMessage(error) };
      }
      return { error: null };
    } catch (err) {
      return { error: getFriendlyErrorMessage(err) };
    }
  },

  /**
   * Retrieves the current active session
   */
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
