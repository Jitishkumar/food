import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase-config';
import { AccountManager } from './src/utils/AccountManager';
import AppNavigator from './AppNavigator';

export default function App() {
  const [session, setSession] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // One-time migration: Clear old tokens after Supabase settings update
    const migrateOldTokens = async () => {
      try {
        const migrated = await AsyncStorage.getItem('@tokens_migrated_v2');
        if (!migrated) {
          console.log('🔄 Migrating: Clearing old expired tokens...');
          await AccountManager.clearAll();
          await AsyncStorage.setItem('@tokens_migrated_v2', 'true');
          console.log('✅ Migration complete. Please log in again.');
        }
      } catch (error) {
        console.error('Migration error:', error);
      }
    };

    migrateOldTokens();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadUserProfile(session.user.id);
      } else {
        setUserType(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('Profile not found, user needs to complete registration');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }
        throw error;
      }
      
      setUserType(data?.user_type);
    } catch (error) {
      console.error('Error loading profile:', error);
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AppNavigator user={session?.user} userType={userType} />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
