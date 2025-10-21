import { AccountManager } from './AccountManager';
import { supabase } from '../supabase-config';

/**
 * Clear all old accounts and force fresh login
 * Run this once to clear expired tokens after updating Supabase settings
 */
export const clearOldAccountsAndRefresh = async () => {
  try {
    // Clear all saved accounts (they have old tokens)
    await AccountManager.clearAll();
    
    // Sign out current user
    await supabase.auth.signOut();
    
    console.log('✅ Cleared old accounts. Please log in again to get new long-lasting tokens.');
    return true;
  } catch (error) {
    console.error('Error clearing old accounts:', error);
    return false;
  }
};
