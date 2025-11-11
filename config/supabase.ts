// /config/supabase.ts

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://wbnhtuktxccnxqqonryg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indibmh0dWt0eGNjbnhxcW9ucnlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MjA0NDIsImV4cCI6MjA3ODM5NjQ0Mn0.vZc6Ny0cNBeSCLJvxfjVoG-K7mOscTaPbqegphvUojo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Dans un projet réel, utilisez AsyncStorage ou SecureStore
    storage: {
      getItem: (key) => null, 
      setItem: (key, value) => {},
      removeItem: (key) => {},
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

