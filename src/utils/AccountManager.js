import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCOUNTS_KEY = 'savedAccounts'; // Match web version key

/**
 * Account Manager for Instagram-like account switching
 * Stores email + refresh token + stored password for instant switch
 */
export const AccountManager = {
  /**
   * Save/update account info after successful login/refresh
   * storedPassword is optional but enables direct signIn on switch
   */
  async saveAccount(userId, email, fullName, userType, refreshToken, storedPassword) {
    try {
      const accounts = await this.getSavedAccounts();

      // Find existing account by email
      const existingIndex = accounts.findIndex(acc => acc.email === email);
      const existing = existingIndex >= 0 ? accounts[existingIndex] : {};

      const accountData = {
        userId,
        email,
        fullName: fullName || existing.fullName || 'User',
        userType: userType ?? existing.userType ?? null,
        username: (email || existing.email || '').split('@')[0] || existing.username || 'user',
        avatar_url: existing.avatar_url ?? null,
        session_token: refreshToken ?? existing.session_token ?? null,
        stored_password: storedPassword ?? existing.stored_password ?? null,
        lastUsed: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        // Merge to preserve any previously saved fields
        accounts[existingIndex] = { ...existing, ...accountData };
      } else {
        accounts.push(accountData);
      }

      await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      return true;
    } catch (error) {
      console.error('Error saving account:', error);
      return false;
    }
  },

  /**
   * Get all saved accounts
   */
  async getSavedAccounts() {
    try {
      const data = await AsyncStorage.getItem(ACCOUNTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting saved accounts:', error);
      return [];
    }
  },

  /**
   * Update last used timestamp for an account
   */
  async updateLastUsed(userId) {
    try {
      const accounts = await this.getSavedAccounts();
      const index = accounts.findIndex(acc => acc.userId === userId);
      
      if (index >= 0) {
        accounts[index].lastUsed = new Date().toISOString();
        await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      }
    } catch (error) {
      console.error('Error updating last used:', error);
    }
  },

  /**
   * Remove an account from saved accounts
   */
  async removeAccount(userId) {
    try {
      const accounts = await this.getSavedAccounts();
      const filtered = accounts.filter(acc => acc.userId !== userId);
      await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error removing account:', error);
      return false;
    }
  },

  /**
   * Get account by userId
   */
  async getAccount(userId) {
    try {
      const accounts = await this.getSavedAccounts();
      return accounts.find(acc => acc.userId === userId);
    } catch (error) {
      console.error('Error getting account:', error);
      return null;
    }
  },

  /**
   * Clear all saved accounts
   */
  async clearAll() {
    try {
      await AsyncStorage.removeItem(ACCOUNTS_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing accounts:', error);
      return false;
    }
  },
};
