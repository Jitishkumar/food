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
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { supabase } from '../../supabase-config';

export default function NearbyScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 80 + (insets.bottom > 0 ? insets.bottom : 20);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRange, setSelectedRange] = useState(5); // default 5km
  const [location, setLocation] = useState(null);
  const [nearbyBusinesses, setNearbyBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeTab, setActiveTab] = useState('nearby'); // 'nearby' or 'random'
  const [placeSearchResults, setPlaceSearchResults] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Get screen dimensions for responsive layout
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;

  const ranges = [1, 5, 10, 20, 30, 40];
  
  useEffect(() => {
    requestLocationPermission();
    loadCategories();
  }, []);

  // Function to search for places by name/address
  const searchPlaces = (query) => {
    // Clear previous timeout if exists
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set a new timeout to avoid too many API calls
    const newTimeout = setTimeout(async () => {
      if (query.length < 2) {
        setPlaceSearchResults([]);
        return;
      }

      try {
        // This is a simplified example - in a real app, you would use a geocoding API
        // For now, we'll just simulate results based on the query
        const mockResults = [
          { id: 1, name: `${query} City`, address: `123 Main St, ${query} City` },
          { id: 2, name: `${query} Town`, address: `456 Oak Ave, ${query} Town` },
          { id: 3, name: `${query} Village`, address: `789 Pine Rd, ${query} Village` }
        ];
        
        setPlaceSearchResults(mockResults);
      } catch (error) {
        console.error('Error searching places:', error);
      }
    }, 300); // 300ms debounce

    setSearchTimeout(newTimeout);
  };

  // Function to select a place and search for food there
  const selectPlace = (place) => {
    setSearchQuery(place.name);
    setPlaceSearchResults([]);
    // In a real app, you would get coordinates for this place and use them for search
    // For now, we'll just use the current location
    searchNearby();
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to find restaurants near you. You can enable it in your device settings.',
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
      // Search for businesses
      const { data, error } = await supabase.rpc('search_businesses_nearby', {
        user_lat: location.latitude,
        user_lon: location.longitude,
        search_radius: selectedRange,
        search_query: searchQuery || null,
        search_category: selectedCategory?.id || null,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setNearbyBusinesses(data);
      } else {
        // No results found
        Alert.alert(
          'No Results',
          `No restaurants found within ${selectedRange}km${searchQuery ? ` matching "${searchQuery}"` : ''}${selectedCategory ? ` in category "${selectedCategory.name}"` : ''}.`,
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
      Alert.alert('Error', 'Failed to search nearby restaurants. Please try again.');
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🏪 Nearby Places</Text>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'nearby' && styles.activeTab]}
            onPress={() => setActiveTab('nearby')}
          >
            <Text style={[styles.tabText, activeTab === 'nearby' && styles.activeTabText]}>
              Nearby Places
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'random' && styles.activeTab]}
            onPress={() => setActiveTab('random')}
          >
            <Text style={[styles.tabText, activeTab === 'random' && styles.activeTabText]}>
              Search Places
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
        >
          {/* Search Section */}
          <View style={styles.searchSection}>
            <Text style={styles.sectionTitle}>
              {activeTab === 'nearby' ? 'Find Restaurants Near You' : 'Search Any Location'}
            </Text>
            
            <TextInput
              style={styles.searchInput}
              placeholder={activeTab === 'nearby' ? "Search for restaurant or shop..." : "Enter location name or address..."}
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (activeTab === 'random') {
                  searchPlaces(text);
                }
              }}
            />

            {/* Place search results */}
            {activeTab === 'random' && placeSearchResults.length > 0 && (
              <View style={styles.searchResults}>
                {placeSearchResults.map((place) => (
                  <TouchableOpacity
                    key={place.id}
                    style={styles.searchResultItem}
                    onPress={() => selectPlace(place)}
                  >
                    <Text style={styles.searchResultName}>{place.name}</Text>
                    <Text style={styles.searchResultAddress}>{place.address}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

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
                {loading ? 'Searching...' : '🔍 Search'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Category Filters */}
          {activeTab === 'nearby' && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory?.id === category.id && styles.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={styles.categoryIcon}>{category.icon || '🍽️'}</Text>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Results */}
          {nearbyBusinesses.length > 0 && (
            <View style={styles.resultsSection}>
              <Text style={styles.sectionTitle}>
                Found {nearbyBusinesses.length} places nearby
              </Text>
              {nearbyBusinesses.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.businessCard}
                  onPress={() => navigation.navigate('BusinessDetail', { businessId: item.id })}
                >
                  <View style={styles.businessCardHeader}>
                    <View style={styles.businessCardInfo}>
                      <Text style={styles.businessCardName}>{item.business_name}</Text>
                      <Text style={styles.businessCardType}>{item.business_type}</Text>
                      <Text style={styles.businessCardDistance}>
                        📍 {item.distance?.toFixed(1)} km away
                      </Text>
                      {item.avg_rating > 0 && (
                        <Text style={styles.businessCardRating}>
                          ⭐ {item.avg_rating.toFixed(1)}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.businessCardActions}>
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
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {nearbyBusinesses.length === 0 && !loading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🔍</Text>
              <Text style={styles.emptyStateText}>
                {activeTab === 'nearby' 
                  ? 'Search for restaurants near you to get started'
                  : 'Enter a location to search for restaurants'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 20, // SafeAreaView handles the notch spacing
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#e8f5e9',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  searchSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  searchResults: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: -8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  searchResultAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
  rangeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  rangeButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  rangeText: {
    color: '#666',
    fontWeight: '600',
  },
  rangeTextActive: {
    color: '#fff',
  },
  selectedCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#e8f5e9',
    padding: 10,
    borderRadius: 8,
  },
  selectedCategoryText: {
    flex: 1,
    color: '#2E7D32',
    fontWeight: '600',
  },
  clearCategoryButton: {
    padding: 4,
  },
  clearCategoryText: {
    color: '#d32f2f',
    fontWeight: '600',
  },
  searchButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryButton: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  categoryButtonActive: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 8,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  resultsSection: {
    padding: 16,
  },
  businessCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  businessCardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  businessCardInfo: {
    flex: 1,
  },
  businessCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  businessCardType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  businessCardDistance: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  businessCardRating: {
    fontSize: 14,
    color: '#FFA000',
    fontWeight: '600',
    marginTop: 4,
  },
  businessCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  actionButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});