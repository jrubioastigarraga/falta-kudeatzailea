/**
 * Supabase configuration.
 *
 * Project: jfkfcvclvcqmgtexuhms
 * The anon key is a public key (safe to ship in the browser bundle). Row Level
 * Security in supabase/schema.sql protects the data.
 *
 * If these values are emptied the app falls back to DEMO mode (localStorage).
 */
export const environment = {
  production: true,
  supabaseUrl: 'https://jfkfcvclvcqmgtexuhms.supabase.co',
  supabaseAnonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impma2ZjdmNsdmNxbWd0ZXh1aG1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0MDM4NzIsImV4cCI6MjEwOTk3OTg3Mn0.4Zi8f978wd070pyh_SZqdzTdAaEl5rgJKGs4HrBmW0I',
};

export const isSupabaseConfigured = (): boolean =>
  environment.supabaseUrl.trim().length > 0 && environment.supabaseAnonKey.trim().length > 0;
