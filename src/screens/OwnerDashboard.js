import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { supabase } from '../../supabase-config';
import Sidebar from '../components/Sidebar';
import OwnerReviewsScreen from './OwnerReviewsScreen';

const Tab = createBottomTabNavigator();

function DashboardTab({ navigation, route }) {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalBusinesses: 0, totalFoodItems: 0, totalReviews: 0 });
  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    loadBusinesses();
  }, []);

  // Listen for refresh parameter from ManageBusinessScreen
  useEffect(() => {
    if (route?.params?.refresh) {
      loadBusinesses();
    }
  }, [route?.params?.refresh]);

  useFocusEffect(
    useCallback(() => {
      loadBusinesses();
    }, [])
  );

  const loadBusinesses = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get businesses
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*, food_items(count)')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (businessError) throw businessError;

      setBusinesses(businessData || []);

      // Get stats
      const { data: foodItems } = await supabase
        .from('food_items')
        .select('id')
        .in('business_id', (businessData || []).map(b => b.id));

      const { data: reviews } = await supabase
        .from('reviews')
        .select('id')
        .in('business_id', (businessData || []).map(b => b.id));

      setStats({
        totalBusinesses: businessData?.length || 0,
        totalFoodItems: foodItems?.length || 0,
        totalReviews: reviews?.length || 0,
      });
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBusiness = () => {
    // Check if user already has businesses
    if (businesses.length > 0) {
      // Show warning about location validation
      Alert.alert(
        "Location Validation",
        "You cannot create multiple businesses at the same location. Each business must have a unique location.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Continue", 
            onPress: () => navigation.navigate('AddBusiness')
          }
        ]
      );
    } else {
      // First business, no validation needed
      navigation.navigate('AddBusiness');
    }
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <Sidebar 
        navigation={navigation}
        isVisible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <Text style={styles.menuButtonText}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🏪 Owner Dashboard</Text>
        </View>
      </View>
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadBusinesses} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalBusinesses}</Text>
            <Text style={styles.statLabel}>Businesses</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalFoodItems}</Text>
            <Text style={styles.statLabel}>Food Items</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalReviews}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>

        {/* Add Business Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddBusiness}
        >
          <Text style={styles.addButtonText}>➕ Add New Business</Text>
        </TouchableOpacity>

        {/* Businesses List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Businesses</Text>
          
          {businesses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🏪</Text>
              <Text style={styles.emptyStateText}>
                No businesses yet. Add your first business to start posting food items!
              </Text>
            </View>
          ) : (
            businesses.map((business) => (
              <TouchableOpacity
                key={business.id}
                style={styles.businessCard}
                onPress={() => navigation.navigate('BusinessDetail', { businessId: business.id })}
              >
                <View style={styles.businessInfo}>
                  <Text style={styles.businessName}>{business.business_name}</Text>
                  <Text style={styles.businessType}>{business.business_type}</Text>
                  <Text style={styles.businessPhone}>📞 {business.phone_number}</Text>
                  <Text style={styles.businessStatus}>
                    {business.is_active ? '✅ Active' : '❌ Inactive'}
                  </Text>
                </View>
                <View style={styles.businessActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      navigation.navigate('AddFoodItem', { businessId: business.id });
                    }}
                  >
                    <Text style={styles.actionBtnText}>➕ Add Food</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionSecondaryBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      navigation.navigate('ManageBusiness', {
                        businessId: business.id,
                      });
                    }}
                  >
                    <Text style={styles.actionSecondaryBtnText}>✏️ Edit</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export default function OwnerDashboard({ navigation }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24 }}>🏪</Text>
          ),
        }}
      >
        {(props) => <DashboardTab {...props} navigation={navigation} />}
      </Tab.Screen>
      <Tab.Screen
        name="ReviewsTab"
        options={{
          tabBarLabel: 'Reviews',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24 }}>⭐</Text>
          ),
        }}
      >
        {(props) => <OwnerReviewsScreen {...props} navigation={navigation} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#FF6B35',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginRight: 12,
    padding: 4,
  },
  menuButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 8,
  },
  profileText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#FF6B35',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  businessCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  businessInfo: {
    marginBottom: 12,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  businessType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  businessPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  businessStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  businessActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actionSecondaryBtn: {
    flex: 1,
    backgroundColor: '#fff5f0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  actionSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
