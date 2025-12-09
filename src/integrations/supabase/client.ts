import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xdmcunenvvvkzcqewmsr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkbWN1bmVudnZ2a3pjcWV3bXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMDMxOTQsImV4cCI6MjA4MDg3OTE5NH0.OzZwCo7_bvWwZ7TLUyT5W4jK6hobJnThT_E_uf_E1mY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
