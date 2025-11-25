import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zntewesmqyoisyvpdeut.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpudGV3ZXNtcXlvaXN5dnBkZXV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzEzMTYsImV4cCI6MjA3OTU0NzMxNn0.jiATmqpT5CeOZoBbKUZ2NGoV-DmG7cdG0gK3PobRFhg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
