import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here'
);

export const configErrorMessage = !isSupabaseConfigured
  ? 'Supabase configuration is missing or incomplete.\n\nPlease define EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file and restart the development server.'
  : null;

/**
 * Initializes and exports the Supabase client.
 * If credentials are not yet configured, a fallback placeholder client is used
 * so imports do not immediately crash before the ConfigErrorScreen can display.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl && supabaseUrl.startsWith('http')
    ? supabaseUrl
    : 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
