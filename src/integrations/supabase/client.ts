import { createClient } from '@supabase/supabase-js';

// Hardcoding Supabase credentials as environment variables are not being injected by Vite runtime.
const supabaseUrl = 'https://ynlebwtutvyxybqgupke.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlubGVid3R1dHZ5eHlicWd1cGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDA0NTMsImV4cCI6MjA3OTExNjQ1M30.-Mgv5jFyg0k1723-LCj2h-teE-eblUGXn8XorgyNn4g';

if (!supabaseUrl || !supabaseAnonKey) {
  // This check is now redundant but kept for safety if values were empty strings
  throw new Error('Supabase URL and Anon Key must be defined.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);