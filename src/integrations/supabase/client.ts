import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://icitqsmydcvrecczsmat.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljaXRxc215ZGN2cmVjY3pzbWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyOTk1OTUsImV4cCI6MjA4MDg3NTU5NX0.Iszw2rtnGWISyln2HYWwek5AWioExLgiTVQONW9G7e4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
