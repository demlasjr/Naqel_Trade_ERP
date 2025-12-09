import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jrxwutpbchywyxcidpnw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyeHd1dHBiY2h5d3l4Y2lkcG53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTgyMjgsImV4cCI6MjA4MDg5NDIyOH0.4h2-30Onox-G-SMLtLaSSJmvEYUR2bkzssdZqZWcyf8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
