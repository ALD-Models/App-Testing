import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hlmhzeipwiuzmxjtjnam.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsbWh6ZWlwd2l1em14anRqbmFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MzI1MjQsImV4cCI6MjA1NjAwODUyNH0.G1GB-SiyAjQ3TI0hONjb3l-IMjqLIBu4lhOO6EEZ5jw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});

// Mock auth functions for development
export const mockAuth = {
  signInWithOtp: async () => ({ data: {}, error: null }),
  verifyOtp: async () => ({ data: {}, error: null }),
};
