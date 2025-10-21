import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '../supabase-config';
import { AccountManager } from '../utils/AccountManager';

export default function AccountSwitcher({ visible, onClose, currentUserId, onAddAccount }) {
  const [accounts, setAccounts] = useState([]);
  const [switching, setSwitching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadAccounts();
    }
  }, [visible]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      const savedAccounts = await AccountManager.getSavedAccounts();
      
      // Filter out current user and remove duplicates (like web version)
      const uniqueAccounts = savedAccounts.filter(
        (account, index, self) =>
          account.userId !== currentUserId && // Remove current user
          index === self.findIndex((a) => a.email === account.email) // Remove duplicates
      );
      
      // Sort by last used
      uniqueAccounts.sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed));
      setAccounts(uniqueAccounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = async (account) => {
    if (account.userId === currentUserId) {
      onClose();
      return;
    }

    setSwitching(true);
    try {
      // 1) Try direct sign-in with stored password first (web parity)
      if (account.stored_password) {
        const { error: pwdError } = await supabase.auth.signInWithPassword({
          email: account.email,
          password: account.stored_password,
        });
        if (!pwdError) {
          // Update last used; session listener will navigate
          await AccountManager.updateLastUsed(account.userId);
          onClose();
          return;
        }
      }

      // 2) Fallback: try refresh token if available
      if (account.session_token) {
        const { data, error } = await supabase.auth.refreshSession({
          refresh_token: account.session_token,
        });
        if (!error && data?.session) {
          await AccountManager.saveAccount(
            account.userId,
            account.email,
            account.fullName,
            account.userType,
            data.session.refresh_token,
            account.stored_password || null
          );
          await AccountManager.updateLastUsed(account.userId);
          onClose();
          return;
        }
      }

      // 3) Both failed -> require re-login
      onClose();
      await supabase.auth.signOut();
      if (onAddAccount) {
        onAddAccount(account.email);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to switch account. Please log in again.');
      console.error('Error switching account:', error);
    } finally {
      setSwitching(false);
    }
  };

  const handleRemoveAccount = async (userId, email) => {
    Alert.alert(
      'Remove Account',
      `Remove ${email} from saved accounts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await AccountManager.removeAccount(userId);
            loadAccounts();
          },
        },
      ]
    );
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Switch Account</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B35" />
            </View>
          ) : (
            <ScrollView style={styles.accountsList}>
              {accounts.map((account) => (
                <View key={account.userId} style={styles.accountItem}>
                  <TouchableOpacity
                    style={styles.accountButton}
                    onPress={() => handleSwitchAccount(account)}
                    disabled={switching}
                  >
                    <View style={styles.accountInfo}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {getInitials(account.fullName)}
                        </Text>
                      </View>
                      <View style={styles.accountDetails}>
                        <Text style={styles.accountName}>
                          {account.fullName || 'Unknown'}
                        </Text>
                        <Text style={styles.accountEmail}>{account.email}</Text>
                        <Text style={styles.accountUsername}>
                          @{account.username || account.email.split('@')[0]}
                        </Text>
                      </View>
                    </View>
                    {account.userId === currentUserId && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Current</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {account.userId !== currentUserId && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveAccount(account.userId, account.email)}
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {accounts.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    No saved accounts. Log in to save accounts for quick switching.
                  </Text>
                </View>
              )}
            </ScrollView>
          )}

          <TouchableOpacity
            style={styles.addAccountButton}
            onPress={() => {
              onClose();
              if (onAddAccount) {
                onAddAccount();
              }
            }}
          >
            <Text style={styles.addAccountButtonText}>+ Add Another Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  accountsList: {
    maxHeight: 400,
  },
  accountItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  accountEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  accountUsername: {
    fontSize: 12,
    color: '#999',
  },
  currentBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  addAccountButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
  },
  addAccountButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
});
