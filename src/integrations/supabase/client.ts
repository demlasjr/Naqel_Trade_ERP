import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://igdinbgtnhpcnonbjgdn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnZGluYmd0bmhwY25vbmJqZ2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMDM0MjMsImV4cCI6MjA4MDg3OTQyM30.qr8JvygICgLkMHz2vrxAGcpEGHVqSKg1Wj1KHNnSvF0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
