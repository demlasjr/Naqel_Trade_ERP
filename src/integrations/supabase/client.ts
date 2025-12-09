import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kanzqthiyadeycfcqnlb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthbnpxdGhpeWFkZXljZmNxbmxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTc2ODgsImV4cCI6MjA4MDg5MzY4OH0.mmoE5gr7IvwZbVq9Af0QGFLCHG05BkeBkUq9KMq5o9s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
