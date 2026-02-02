import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = 'https://aiylthjfiqemwzxcgjnf.supabase.co';
const supabaseAnonKey = 'sb_publishable_q7WroT0w59A1KAKNZIaCqw_XDvGmU2N';

// Create storage adapter that works for both web and native
const createStorageAdapter = () => {
  if (Platform.OS === 'web') {
    // Use localStorage for web
    return {
      getItem: (key) => {
        if (typeof localStorage !== 'undefined') {
          return Promise.resolve(localStorage.getItem(key));
        }
        return Promise.resolve(null);
      },
      setItem: (key, value) => {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
        }
        return Promise.resolve();
      },
      removeItem: (key) => {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
        }
        return Promise.resolve();
      },
    };
  } else {
    // Use SecureStore for native platforms
    return {
      getItem: (key) => {
        return SecureStore.getItemAsync(key);
      },
      setItem: (key, value) => {
        return SecureStore.setItemAsync(key, value);
      },
      removeItem: (key) => {
        return SecureStore.deleteItemAsync(key);
      },
    };
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
