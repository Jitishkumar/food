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

const ProfileScreen = ({ navigation, route }) => {
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

  const handleBack = () => {
    if (profile?.user_type === 'owner') {
      navigation.navigate('OwnerDashboard');
    } else {
      navigation.navigate('Home');
    }
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
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.replace('Login')}>
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
        <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
          <Text style={styles.secondaryButtonText}>← Back to Dashboard</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    color: '#6b7280',
  },
  value: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  helperText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#4b5563',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default ProfileScreen;
