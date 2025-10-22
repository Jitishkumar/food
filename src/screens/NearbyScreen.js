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
import { useFocusEffect, useRoute } from '@react-navigation/native';
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
  const [searchCity, setSearchCity] = useState('');
  const [searchState, setSearchState] = useState('');
  const [searchFoodName, setSearchFoodName] = useState('');

  // Get screen dimensions for responsive layout
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;

  const ranges = [1, 5, 10, 20, 30, 40];
  
  const route = useRoute();

  useEffect(() => {
    requestLocationPermission();
    loadCategories();
    
    // Check for category from navigation params
    if (route.params?.selectedCategory) {
      setSelectedCategory(route.params.selectedCategory);
      // Clear the params to avoid reapplying on re-render
      navigation.setParams({ selectedCategory: undefined });
    }
  }, [route.params?.selectedCategory]);

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

  // Categorize results into sections based on match type
  const categorizeResults = (results, foodQuery, cityQuery, stateQuery) => {
    const exactMatch = [];
    const cityStateMatch = [];
    const stateOnlyMatch = [];

    results.forEach(item => {
      const foodNameMatches = !foodQuery || 
        item.name?.toLowerCase().includes(foodQuery.toLowerCase());
      const cityMatches = !cityQuery || 
        item.city?.toLowerCase() === cityQuery.toLowerCase();
      const stateMatches = !stateQuery || 
        item.state?.toLowerCase() === stateQuery.toLowerCase();

      if (foodNameMatches && cityMatches && stateMatches) {
        exactMatch.push(item);
      } else if (cityMatches && stateMatches) {
        cityStateMatch.push(item);
      } else if (stateMatches) {
        stateOnlyMatch.push(item);
      }
    });

    return { exactMatch, cityStateMatch, stateMatch: stateOnlyMatch };
  };

  const searchNearby = async () => {
    // For Search Places tab, don't require location
    if (activeTab === 'nearby') {
      if (!location) {
        await requestLocationPermission();
        if (!location) {
          return; // Exit if still no location after request
        }
      }
    }

    setLoading(true);
    try {
      let allResults = [];

      if (activeTab === 'nearby') {
        // Nearby tab - use the standard search function
        const searchParams = {
          user_lat: location?.latitude || 0,
          user_lon: location?.longitude || 0,
          search_radius: selectedRange,
          search_query: searchFoodName || null,
          search_category: selectedCategory?.id || null,
          search_city: searchCity || null,
          search_state: searchState || null,
        };

        const { data, error } = await supabase.rpc('search_food_items_by_location', searchParams);
        if (error) throw error;
        allResults = data || [];
      } else {
        // Search Places tab - fetch results in layers
        // Layer 1: Exact match (food name + city + state)
        if (searchFoodName && searchCity && searchState) {
          const { data: exactData } = await supabase
            .from('food_items')
            .select('*')
            .ilike('name', `%${searchFoodName}%`)
            .ilike('city', `%${searchCity}%`)
            .ilike('state', `%${searchState}%`);
          allResults = [...(exactData || [])];
        }

        // Layer 2: City & State match (any food with same city and state)
        if (searchCity && searchState) {
          const { data: cityStateData } = await supabase
            .from('food_items')
            .select('*')
            .ilike('city', `%${searchCity}%`)
            .ilike('state', `%${searchState}%`);
          
          // Add items that aren't already in results
          const existingIds = new Set(allResults.map(r => r.id));
          const newItems = (cityStateData || []).filter(item => !existingIds.has(item.id));
          allResults = [...allResults, ...newItems];
        }

        // Layer 3: State match (any food with same state)
        if (searchState) {
          const { data: stateData } = await supabase
            .from('food_items')
            .select('*')
            .ilike('state', `%${searchState}%`);
          
          // Add items that aren't already in results
          const existingIds = new Set(allResults.map(r => r.id));
          const newItems = (stateData || []).filter(item => !existingIds.has(item.id));
          allResults = [...allResults, ...newItems];
        }
      }

      if (allResults && allResults.length > 0) {
        setNearbyBusinesses(allResults);
      } else {
        // No results found
        let filterText = '';
        if (searchFoodName) filterText += ` matching "${searchFoodName}"`;
        if (searchCity) filterText += ` in ${searchCity}`;
        if (searchState) filterText += `, ${searchState}`;
        if (selectedCategory) filterText += ` in category "${selectedCategory.name}"`;
        
        if (activeTab === 'nearby') {
          Alert.alert(
            'No Results',
            `No food items found within ${selectedRange}km${filterText}.`,
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
        } else {
          Alert.alert(
            'No Results',
            `No food items found${filterText}.`,
            [{ text: 'OK' }]
          );
        }
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
            
            {activeTab === 'nearby' ? (
              <>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for food name (optional)"
                  placeholderTextColor="#999"
                  value={searchFoodName}
                  onChangeText={setSearchFoodName}
                />
                
                <View style={styles.cityStateRow}>
                  <TextInput
                    style={[styles.searchInput, styles.halfInput]}
                    placeholder="City (optional)"
                    placeholderTextColor="#999"
                    value={searchCity}
                    onChangeText={setSearchCity}
                  />
                  <TextInput
                    style={[styles.searchInput, styles.halfInput]}
                    placeholder="State (optional)"
                    placeholderTextColor="#999"
                    value={searchState}
                    onChangeText={setSearchState}
                  />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.sectionSubtitle}>Search by Food Name, City & State</Text>
                
                <TextInput
                  style={styles.searchInput}
                  placeholder="Food Name"
                  placeholderTextColor="#999"
                  value={searchFoodName}
                  onChangeText={setSearchFoodName}
                />

                <View style={styles.cityStateRow}>
                  <TextInput
                    style={[styles.searchInput, styles.halfInput]}
                    placeholder="City"
                    placeholderTextColor="#999"
                    value={searchCity}
                    onChangeText={setSearchCity}
                  />
                  <TextInput
                    style={[styles.searchInput, styles.halfInput]}
                    placeholder="State"
                    placeholderTextColor="#999"
                    value={searchState}
                    onChangeText={setSearchState}
                  />
                </View>
              </>
            )}

            {/* Display selected filters - only for nearby tab */}
            {(searchFoodName || searchCity || searchState) && activeTab === 'nearby' && (
              <View style={styles.selectedFiltersContainer}>
                {searchFoodName && (
                  <View style={styles.filterTag}>
                    <Text style={styles.filterTagText}>🍽️ {searchFoodName}</Text>
                  </View>
                )}
                {searchCity && (
                  <View style={styles.filterTag}>
                    <Text style={styles.filterTagText}>📍 {searchCity}</Text>
                  </View>
                )}
                {searchState && (
                  <View style={styles.filterTag}>
                    <Text style={styles.filterTagText}>🗺️ {searchState}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Range Selection - only for nearby tab */}
            {activeTab === 'nearby' && (
              <>
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
              </>
            )}

            {/* Category Selection - only for nearby tab */}
            {activeTab === 'nearby' && selectedCategory && (
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
              style={[styles.searchButton, loading && styles.searchButtonDisabled]}
              onPress={searchNearby}
              disabled={loading}
            >
              <Text style={styles.searchButtonText}>
                {loading ? 'Searching...' : activeTab === 'nearby' ? '🔍 Search Nearby' : '🔍 Search Places'}
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
              {activeTab === 'nearby' ? (
                // Nearby tab - show all results in one list
                <>
                  <Text style={styles.sectionTitle}>
                    Found {nearbyBusinesses.length} food items nearby
                  </Text>
                  {nearbyBusinesses.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.businessCard}
                      onPress={() => navigation.navigate('BusinessDetail', { businessId: item.business_id })}
                    >
                      <View style={styles.businessCardHeader}>
                        <View style={styles.businessCardInfo}>
                          <Text style={styles.businessCardName}>{item.name}</Text>
                          <Text style={styles.businessCardType}>{item.category_name || 'Food Item'}</Text>
                          <Text style={styles.businessCardPrice}>₹{item.price?.toFixed(2)}</Text>
                          <Text style={styles.businessCardDistance}>
                            📍 {item.distance?.toFixed(1)} km away • {item.business_name}
                          </Text>
                          {item.city && item.state && (
                            <Text style={styles.businessCardLocation}>
                              🗺️ {item.city}, {item.state}
                            </Text>
                          )}
                          {item.average_rating > 0 && (
                            <Text style={styles.businessCardRating}>
                              ⭐ {item.average_rating.toFixed(1)} ({item.total_reviews} reviews)
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
                </>
              ) : (
                // Search Places tab - show categorized results
                (() => {
                  const { exactMatch, cityStateMatch, stateMatch } = categorizeResults(
                    nearbyBusinesses,
                    searchFoodName,
                    searchCity,
                    searchState
                  );

                  const renderFoodCard = (item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.businessCard}
                      onPress={() => navigation.navigate('BusinessDetail', { businessId: item.business_id })}
                    >
                      <View style={styles.businessCardHeader}>
                        <View style={styles.businessCardInfo}>
                          <Text style={styles.businessCardName}>{item.name}</Text>
                          <Text style={styles.businessCardType}>{item.category_name || 'Food Item'}</Text>
                          <Text style={styles.businessCardPrice}>₹{item.price?.toFixed(2)}</Text>
                          <Text style={styles.businessCardDistance}>
                            📍 {item.distance?.toFixed(1)} km away • {item.business_name}
                          </Text>
                          {item.city && item.state && (
                            <Text style={styles.businessCardLocation}>
                              🗺️ {item.city}, {item.state}
                            </Text>
                          )}
                          {item.average_rating > 0 && (
                            <Text style={styles.businessCardRating}>
                              ⭐ {item.average_rating.toFixed(1)} ({item.total_reviews} reviews)
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
                  );

                  return (
                    <>
                      {/* Exact Match Section */}
                      {exactMatch.length > 0 && (
                        <View style={styles.resultCategory}>
                          <View style={styles.categoryHeader}>
                            <Text style={styles.categoryTitle}>🎯 Exact Match</Text>
                            <Text style={styles.categoryCount}>{exactMatch.length} items</Text>
                          </View>
                          <Text style={styles.categoryDescription}>
                            Food name, city, and state match your search
                          </Text>
                          {exactMatch.map(renderFoodCard)}
                        </View>
                      )}

                      {/* City & State Match Section */}
                      {cityStateMatch.length > 0 && (
                        <View style={styles.resultCategory}>
                          <View style={styles.categoryHeader}>
                            <Text style={styles.categoryTitle}>📍 Same City & State</Text>
                            <Text style={styles.categoryCount}>{cityStateMatch.length} items</Text>
                          </View>
                          <Text style={styles.categoryDescription}>
                            Available in {searchCity}, {searchState}
                          </Text>
                          {cityStateMatch.map(renderFoodCard)}
                        </View>
                      )}

                      {/* State Match Section */}
                      {stateMatch.length > 0 && (
                        <View style={styles.resultCategory}>
                          <View style={styles.categoryHeader}>
                            <Text style={styles.categoryTitle}>🗺️ Same State</Text>
                            <Text style={styles.categoryCount}>{stateMatch.length} items</Text>
                          </View>
                          <Text style={styles.categoryDescription}>
                            Available in other cities of {searchState}
                          </Text>
                          {stateMatch.map(renderFoodCard)}
                        </View>
                      )}
                    </>
                  );
                })()
              )}
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
  resultCategory: {
    marginBottom: 32,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryCount: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '600',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
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
  businessCardPrice: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  businessCardLocation: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
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
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  cityStateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  selectedFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterTag: {
    backgroundColor: '#FFE8D6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  filterTagText: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: '600',
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
});