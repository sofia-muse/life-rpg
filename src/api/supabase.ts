// Supabase client skeleton
// Replace with your actual Supabase URL and anon key when ready

const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';

// Placeholder: actual Supabase client creation
// import { createClient } from '@supabase/supabase-js';
// export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const supabase = null; // Stub — all game state runs locally for now

export const isSupabaseConfigured = () => {
  return !SUPABASE_URL.includes('YOUR_PROJECT');
};
