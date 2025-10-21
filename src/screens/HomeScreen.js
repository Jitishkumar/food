import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import { supabase } from '../../supabase-config';
import Sidebar from '../components/Sidebar';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 80 + (insets.bottom > 0 ? insets.bottom : 20);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRange, setSelectedRange] = useState(5); // default 5km
  const [location, setLocation] = useState(null);
  const [nearbyFood, setNearbyFood] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [purchaseInProgress, setPurchaseInProgress] = useState(false);

  const route = useRoute();

  const ranges = [1, 5, 10, 20, 30, 40];

  useEffect(() => {
    requestLocationPermission();
    loadCategories();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.categoryId) {
        setSelectedCategory({
          id: route.params.categoryId,
          name: route.params.categoryName,
        });
        navigation.setParams({ categoryId: undefined, categoryName: undefined });
      }
      return () => {};
    }, [route.params?.categoryId, route.params?.categoryName, navigation])
  );

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to find food near you. You can enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings',
              onPress: () => {
                Platform.OS === 'ios' 
                  ? Linking.openURL('app-settings:')
                  : Linking.openSettings();
              }
            }
          ]
        );
        return;
      }

      // Get location with high accuracy
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 10000, // Use cached location if less than 10 seconds old
        timeout: 5000 // Timeout after 5 seconds
      });
      
      setLocation(currentLocation.coords);
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert(
        'Location Error',
        'Could not get your location. Please check if location services are enabled.',
        [
          { text: 'Try Again', onPress: requestLocationPermission },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const searchNearby = async () => {
    // If no location, try to get it first
    if (!location) {
      await requestLocationPermission();
      if (!location) {
        return; // Exit if still no location after request
      }
    }

    setLoading(true);
    try {
      // Search for food items instead of businesses
      const { data, error } = await supabase.rpc('search_food_items_nearby', {
        user_lat: location.latitude,
        user_lon: location.longitude,
        search_radius: selectedRange,
        search_query: searchQuery || null,
        search_category: selectedCategory?.id || null,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setNearbyFood(data);
      } else {
        // No results found
        Alert.alert(
          'No Results',
          `No food items found within ${selectedRange}km${searchQuery ? ` matching "${searchQuery}"` : ''}${selectedCategory ? ` in category "${selectedCategory.name}"` : ''}.`,
          [
            { 
              text: 'Increase Range',
              onPress: () => setSelectedRange(prev => {
                const nextRange = ranges.find(r => r > prev);
                return nextRange || prev;
              })
            },
            { text: 'OK', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search nearby food items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const openInMaps = (latitude, longitude, businessName) => {
    const url = Platform.OS === 'ios'
      ? `maps://app?daddr=${latitude},${longitude}`
      : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${businessName})`;
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open maps');
    });
  };

  const handlePurchase = async (item) => {
    if (purchaseInProgress) return;
    
    setPurchaseInProgress(true);
    try {
      // Check if inventory is still available
      const { data: currentItem, error: checkError } = await supabase
        .from('food_items')
        .select('inventory_count, allow_purchase')
        .eq('id', item.id)
        .single();
      
      if (checkError) throw checkError;
      
      if (!currentItem || currentItem.inventory_count < 1 || !currentItem.allow_purchase) {
        Alert.alert('Not Available', 'This item is no longer available for purchase.');
        return;
      }
      
      // Update inventory count
      const newCount = currentItem.inventory_count - 1;
      const { error: updateError } = await supabase
        .from('food_items')
        .update({ inventory_count: newCount })
        .eq('id', item.id);
      
      if (updateError) throw updateError;
      
      // Update the local state
      setNearbyFood(prev => 
        prev.map(food => 
          food.id === item.id 
            ? { ...food, inventory_count: newCount } 
            : food
        )
      );
      
      Alert.alert(
        'Purchase Successful', 
        `You've purchased ${item.name}. ${newCount > 0 ? `${newCount} remaining in stock.` : 'This was the last one in stock!'}`
      );
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Failed to complete purchase. Please try again.');
    } finally {
      setPurchaseInProgress(false);
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
          <Text style={styles.headerTitle}>🍽️ Food Discover</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
      >
        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Find Food Near You</Text>
          
          <TextInput
            style={styles.searchInput}
            placeholder="Search for food, restaurant, or cuisine..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {/* Range Selection */}
          <Text style={styles.label}>Search Range:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rangeContainer}>
            {ranges.map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.rangeButton,
                  selectedRange === range && styles.rangeButtonActive,
                ]}
                onPress={() => setSelectedRange(range)}
              >
                <Text
                  style={[
                    styles.rangeText,
                    selectedRange === range && styles.rangeTextActive,
                  ]}
                >
                  {range} km
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectedCategory && (
            <View style={styles.selectedCategoryContainer}>
              <Text style={styles.selectedCategoryText}>
                Category: {selectedCategory.name}
              </Text>
              <TouchableOpacity
                style={styles.clearCategoryButton}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={styles.clearCategoryText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.searchButton}
            onPress={searchNearby}
            disabled={loading}
          >
            <Text style={styles.searchButtonText}>
              {loading ? 'Searching...' : '🔍 Search Nearby'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('SpecialFoods')}
          >
            <Text style={styles.actionIcon}>⭐</Text>
            <Text style={styles.actionTitle}>Special Foods</Text>
            <Text style={styles.actionSubtitle}>Discover regional specialties</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Categories')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionTitle}>Categories</Text>
            <Text style={styles.actionSubtitle}>Browse by food type</Text>
          </TouchableOpacity>
        </View>

        {/* Results */}
        {nearbyFood.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>
              Found {nearbyFood.length} food items nearby
            </Text>
            {nearbyFood.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.foodCard}
                onPress={() => navigation.navigate('BusinessDetail', { businessId: item.business_id })}
              >
                <View style={styles.foodCardHeader}>
                  <View style={styles.foodCardInfo}>
                    <Text style={styles.foodCardName}>{item.name}</Text>
                    <Text style={styles.foodCardType}>{item.category_name || 'Food Item'}</Text>
                    <Text style={styles.foodCardPrice}>
                      ₹{item.price?.toFixed(2)}
                    </Text>
                    <Text style={styles.foodCardDistance}>
                      📍 {item.distance?.toFixed(1)} km away • {item.business_name}
                    </Text>
                    <Text style={styles.foodCardInventory}>
                      {item.inventory_count > 0 
                        ? `${item.inventory_count} left in stock` 
                        : 'Out of stock'}
                    </Text>
                  </View>
                </View>

                <View style={styles.foodCardActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      Linking.openURL(`tel:${item.phone_number}`);
                    }}
                  >
                    <Text style={styles.actionButtonText}>📞 Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      openInMaps(item.latitude, item.longitude, item.business_name);
                    }}
                  >
                    <Text style={styles.actionButtonText}>🗺️ Directions</Text>
                  </TouchableOpacity>
                  
                  {item.inventory_count > 0 && item.allow_purchase && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.buyButton]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handlePurchase(item);
                      }}
                      disabled={purchaseInProgress}
                    >
                      <Text style={styles.actionButtonText}>
                        {purchaseInProgress ? 'Processing...' : '🛒 Buy'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {nearbyFood.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔍</Text>
            <Text style={styles.emptyStateText}>
              Search for food near you to get started
            </Text>
          </View>
        )}
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
  content: {
    flex: 1,
  },
  searchSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  rangeContainer: {
    marginBottom: 16,
  },
  foodCardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 4,
  },
  foodCardInventory: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  buyButton: {
    backgroundColor: '#FF6B35',
  },
  rangeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  rangeButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  rangeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  rangeTextActive: {
    color: '#fff',
  },
  selectedCategoryContainer: {
    marginTop: 12,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedCategoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  clearCategoryButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FF6B35',
  },
  clearCategoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  searchButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  resultsSection: {
    padding: 20,
  },
  foodCard: {
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
  foodCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  foodCardInfo: {
    flex: 1,
  },
  foodCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  foodCardType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  foodCardDistance: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  foodCardRating: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  foodCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  actionButtonText: {
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
