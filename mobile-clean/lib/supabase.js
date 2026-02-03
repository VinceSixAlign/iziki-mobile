import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://aiylthjfiqemwzxcgjnf.supabase.co';
const supabaseAnonKey = 'sb_publishable_q7WroT0w59A1KAKNZIaCqw_XDvGmU2N';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
