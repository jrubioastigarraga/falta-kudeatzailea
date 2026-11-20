import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment, isSupabaseConfigured } from './environment';

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const isDemoMode = !isSupabaseConfigured();
