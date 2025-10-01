import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { supabase } from '../supabase-config';

export default function OwnerDashboard({ navigation }) {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalBusinesses: 0, totalFoodItems: 0, totalReviews: 0 });

  useEffect(() => {
    loadBusinesses();
  }, []);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏪 Owner Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
          onPress={() => navigation.navigate('AddBusiness')}
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
                onPress={() => navigation.navigate('ManageBusiness', { businessId: business.id })}
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
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
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
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
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
