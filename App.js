import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from './supabase-config';

// Import screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import OwnerDashboard from './screens/OwnerDashboard';
import AddBusinessScreen from './screens/AddBusinessScreen';
import AddFoodItemScreen from './screens/AddFoodItemScreen';
import SpecialFoodsScreen from './screens/SpecialFoodsScreen';
import BusinessDetailScreen from './screens/BusinessDetailScreen';

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
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
        // If profile doesn't exist yet, sign out and show message
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
      // Sign out on error to prevent stuck state
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
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#fff' },
        }}
      >
        {!user ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : userType === 'owner' ? (
          // Owner Stack
          <>
            <Stack.Screen name="OwnerDashboard" component={OwnerDashboard} />
            <Stack.Screen 
              name="AddBusiness" 
              component={AddBusinessScreen}
              options={{ headerShown: true, title: 'Add Business' }}
            />
            <Stack.Screen 
              name="AddFoodItem" 
              component={AddFoodItemScreen}
              options={{ headerShown: true, title: 'Add Food Item' }}
            />
            <Stack.Screen 
              name="BusinessDetail" 
              component={BusinessDetailScreen}
              options={{ headerShown: true, title: 'Business Details' }}
            />
          </>
        ) : (
          // Customer Stack
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen 
              name="SpecialFoods" 
              component={SpecialFoodsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="BusinessDetail" 
              component={BusinessDetailScreen}
              options={{ headerShown: true, title: 'Business Details' }}
            />
          </>
        )}
      </Stack.Navigator>
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
