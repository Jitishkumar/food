import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { supabase } from '../supabase-config';

const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const {
          data: { user },
          error: sessionError,
        } = await supabase.auth.getUser();

        if (sessionError) throw sessionError;
        if (!user) {
          navigation.replace('Login');
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email, phone_number, user_type, created_at')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        if (isMounted) {
          setProfile(data);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        Alert.alert('Error', 'Could not load your profile.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [navigation]);

  const handleChatPress = async () => {
    try {
      setChatLoading(true);
      // Placeholder for future chat implementation
      await new Promise((resolve) => setTimeout(resolve, 800));
      Alert.alert(
        'Chat Coming Soon',
        'Direct chat support and customer-owner messaging will be available in a future update.'
      );
    } finally {
      setChatLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigation.replace('Login');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Profile information not found.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={handleLogout}>
          <Text style={styles.primaryButtonText}>Sign In Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>My Profile</Text>
      <Text style={styles.subtitle}>Manage your account information and preferences.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Full Name</Text>
          <Text style={styles.value}>{profile.full_name || 'Not provided'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{profile.email}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>{profile.phone_number || 'Not provided'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Account Type</Text>
          <Text style={styles.value}>
            {profile.user_type === 'owner' ? 'Restaurant Owner' : 'Customer'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Member Since</Text>
          <Text style={styles.value}>
            {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Chat & Support</Text>
        <Text style={styles.helperText}>
          Chat with restaurant owners and support will arrive soon. Stay tuned!
        </Text>
        <TouchableOpacity
          style={[styles.primaryButton, chatLoading && styles.disabledButton]}
          onPress={handleChatPress}
          disabled={chatLoading}
        >
          <Text style={styles.primaryButtonText}>
            {chatLoading ? 'Opening Chat...' : 'Chat (Coming Soon)'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account Actions</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dangerButton} onPress={handleLogout}>
          <Text style={styles.dangerButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2933',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 6,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2933',
    marginBottom: 12,
  },
  row: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: '#9aa5b1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#364152',
    fontWeight: '600',
  },
  helperText: {
    fontSize: 14,
    color: '#52606d',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#edeff2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#364152',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#b91c1c',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#b91c1c',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default ProfileScreen;
