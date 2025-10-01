import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://sikuvuepkmuoxvrwvjyo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpa3V2dWVwa211b3h2cnd2anlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjkyOTMsImV4cCI6MjA3NDkwNTI5M30.6X4kOEc02VhyTkd2SOnEIic1WKxYgPgcV027W8WyG8c';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
