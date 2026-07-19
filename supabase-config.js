import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import from environment variables - NO FALLBACKS
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Validate environment variables are loaded
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables!\n' +
    'Make sure .env file exists with:\n' +
    'SUPABASE_URL=your_url\n' +
    'SUPABASE_ANON_KEY=your_key\n\n' +
    'Then run: npx expo start --clear'
  );
}

// Create a simple custom event emitter for React Native
class CustomEventEmitter {
  constructor() {
    this.listeners = {};
    this.maxListeners = 10;
  }

  setMaxListeners(n) {
    this.maxListeners = n;
    return this;
  }

  emit(event, ...args) {
    if (!this.listeners[event]) return false;
    this.listeners[event].forEach(listener => listener(...args));
    return true;
  }

  on(event, listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    
    if (this.listeners[event].length >= this.maxListeners) {
      console.warn(`Warning: Possible memory leak detected. ${this.listeners[event].length} listeners added for event '${event}'`);
    }
    
    this.listeners[event].push(listener);
    return this;
  }

  once(event, listener) {
    const onceListener = (...args) => {
      this.off(event, onceListener);
      listener(...args);
    };
    return this.on(event, onceListener);
  }

  off(event, listener) {
    if (!this.listeners[event]) return this;
    this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    return this;
  }

  removeAllListeners(event) {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
    return this;
  }
}

// Create a custom event emitter instance
const customEmitter = new CustomEventEmitter();
customEmitter.setMaxListeners(20);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    debug: false,
    // Session will be refreshed automatically before expiry
    storageKey: 'supabase-auth-token',
  },
  global: {
    // Provide the custom event emitter to fix the error
    emitter: customEmitter,
    headers: {
      'X-Client-Info': 'supabase-js-react-native',
    },
  },
});
