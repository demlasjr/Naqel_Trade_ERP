import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mjjtviatfhlmrrmgpzjm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qanR2aWF0ZmhsbXJybWdwemptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTY0MTUsImV4cCI6MjA4MDg5MjQxNX0.zJQjm6pTfdtjr5qslBXpy9dyLVmlBGgzungoeE6Zddw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
