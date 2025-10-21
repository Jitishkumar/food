import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { supabase } from '../../supabase-config';
import AccountSwitcher from './AccountSwitcher';

const Sidebar = ({ navigation, isVisible, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    if (isVisible) {
      fetchProfile();
    }
  }, [isVisible]);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email, user_type')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // The AppNavigator will handle the navigation to the Login screen.
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.sidebar}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Menu</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {profile && (
            <View style={styles.profileSection}>
              <View style={styles.profileAvatar}>
                <Text style={styles.avatarText}>
                  {profile.full_name?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
              <Text style={styles.profileName}>{profile.full_name}</Text>
              <Text style={styles.profileEmail}>{profile.email}</Text>
              <Text style={styles.profileType}>
                {profile.user_type === 'owner' ? 'Restaurant Owner' : 'Customer'}
              </Text>
            </View>
          )}

          <ScrollView style={styles.menuItems}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                navigation.navigate('Profile');
                onClose();
              }}
            >
              <Text style={styles.menuItemText}>👤 My Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => setShowAccountSwitcher(true)}
            >
              <Text style={styles.menuItemText}>🔄 Switch Account</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, styles.logoutItem]}
              onPress={handleLogout}
            >
              <Text style={styles.logoutText}>🚪 Logout</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Account Switcher Modal */}
      <AccountSwitcher
        visible={showAccountSwitcher}
        onClose={() => setShowAccountSwitcher(false)}
        currentUserId={currentUserId}
        onAddAccount={async (prefilledEmail) => {
          onClose();
          // Sign out - App.js will automatically show Login screen
          await supabase.auth.signOut();
          // Note: prefilledEmail will be lost, but that's okay for "Add Account"
        }}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: '80%',
    backgroundColor: '#fff',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2933',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6b7280',
  },
  profileSection: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2933',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  profileType: {
    fontSize: 12,
    color: '#FF6B35',
    backgroundColor: '#fff5f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItems: {
    flex: 1,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#1f2933',
  },
  logoutItem: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  logoutText: {
    fontSize: 16,
    color: '#b91c1c',
  },
  accountSwitcherOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  accountSwitcherContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  accountSwitcherTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2933',
    marginBottom: 20,
    textAlign: 'center',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2933',
  },
  accountEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  currentAccount: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  addAccountButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  addAccountText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  closeAccountSwitcherButton: {
    marginTop: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  closeAccountSwitcherText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Sidebar;