import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create client with custom configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Only allow @as.edu.au email addresses
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
});

// Add email domain validation
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session?.user?.email) {
    const emailDomain = session.user.email.split('@')[1];
    if (emailDomain !== 'as.edu.au') {
      // Sign out if not a valid TAS email
      supabase.auth.signOut();
      alert('Please use your @as.edu.au email address to sign in.');
    }
  }
});