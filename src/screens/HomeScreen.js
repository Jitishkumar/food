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
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import { supabase } from '../../supabase-config';
import Sidebar from '../components/Sidebar';
import ReviewModal from '../components/ReviewModal';
import ReportModal from '../components/ReportModal';
import StarRating from '../components/StarRating';
import PurchaseModal from '../components/PurchaseModal';

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
  const [menuVisible, setMenuVisible] = useState(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedFoodItem, setSelectedFoodItem] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [selectedPurchaseItem, setSelectedPurchaseItem] = useState(null);

  const route = useRoute();

  const ranges = [1, 5, 10, 20, 30, 40];

  useEffect(() => {
    requestLocationPermission();
    loadCategories();
    
    // Cleanup timeout on unmount
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
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
    
    // Check if user is logged in
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert(
          'Login Required',
          'Please login to purchase items.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => navigation.navigate('Login') }
          ]
        );
        return;
      }
    } catch (error) {
      Alert.alert('Error', 'Please login to continue');
      return;
    }
    
    // Open purchase modal with code system
    setSelectedPurchaseItem(item);
    setPurchaseModalVisible(true);
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const openMenu = (item) => {
    setSelectedFoodItem(item);
    setMenuVisible(item.id);
  };

  const closeMenu = () => {
    setMenuVisible(null);
  };

  const openReviewModal = (item) => {
    setSelectedFoodItem(item);
    closeMenu();
    setReviewModalVisible(true);
  };

  const openReportModal = (item) => {
    setSelectedFoodItem(item);
    closeMenu();
    setReportModalVisible(true);
  };

  const handleReviewSubmitted = () => {
    // Refresh the food items to get updated ratings
    searchNearby();
  };

  // Levenshtein Distance algorithm for fuzzy matching (typo tolerance)
  const calculateSimilarity = (str1, str2) => {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // If one string contains the other, high score
    if (s1.includes(s2) || s2.includes(s1)) return 0;
    
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix = [];

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Calculate edit distance
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[len1][len2];
  };

  // Check if search term is similar enough to the item name
  const isFuzzyMatch = (itemName, searchTerm, threshold = 3) => {
    const item = itemName.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    // Exact substring match
    if (item.includes(search)) return { match: true, distance: 0 };
    
    // Split search term into words for better matching
    const searchWords = search.split(' ').filter(w => w.length > 0);
    const itemWords = item.split(' ').filter(w => w.length > 0);
    
    // Check each search word against each item word
    for (const searchWord of searchWords) {
      for (const itemWord of itemWords) {
        const distance = calculateSimilarity(searchWord, itemWord);
        const maxLen = Math.max(searchWord.length, itemWord.length);
        
        // Allow 1 character difference for every 3-4 characters
        const allowedDistance = Math.max(1, Math.floor(maxLen / 3));
        
        if (distance <= Math.min(allowedDistance, threshold)) {
          return { match: true, distance };
        }
      }
    }
    
    // Check full string similarity
    const fullDistance = calculateSimilarity(item, search);
    const maxLen = Math.max(item.length, search.length);
    const allowedDistance = Math.max(2, Math.floor(maxLen / 4));
    
    if (fullDistance <= Math.min(allowedDistance, threshold)) {
      return { match: true, distance: fullDistance };
    }
    
    return { match: false, distance: fullDistance };
  };

  const fetchSuggestions = async (query) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const searchTerm = query.trim().toLowerCase();
      
      // Fetch more items for fuzzy matching
      const { data: allFoodItems, error: foodError } = await supabase
        .from('food_items')
        .select('id, name, category_id')
        .eq('is_available', true)
        .limit(100);

      if (foodError) throw foodError;

      const { data: allCategories, error: categoryError } = await supabase
        .from('categories')
        .select('id, name')
        .limit(50);

      if (categoryError) throw categoryError;

      // Filter with fuzzy matching
      const matchedFoodItems = (allFoodItems || [])
        .map(item => ({
          ...item,
          fuzzyMatch: isFuzzyMatch(item.name, searchTerm),
        }))
        .filter(item => item.fuzzyMatch.match)
        .sort((a, b) => a.fuzzyMatch.distance - b.fuzzyMatch.distance)
        .slice(0, 5);

      const matchedCategories = (allCategories || [])
        .map(cat => ({
          ...cat,
          fuzzyMatch: isFuzzyMatch(cat.name, searchTerm),
        }))
        .filter(cat => cat.fuzzyMatch.match)
        .sort((a, b) => a.fuzzyMatch.distance - b.fuzzyMatch.distance)
        .slice(0, 3);

      // Combine and format suggestions
      const combinedSuggestions = [
        ...matchedCategories.map(cat => ({
          id: `category-${cat.id}`,
          name: cat.name,
          type: 'category',
          icon: '📋',
          actualId: cat.id,
          distance: cat.fuzzyMatch.distance,
        })),
        ...matchedFoodItems.map(food => ({
          id: `food-${food.id}`,
          name: food.name,
          type: 'food',
          icon: '🍽️',
          actualId: food.id,
          distance: food.fuzzyMatch.distance,
        })),
      ];

      // Sort by fuzzy match quality (lower distance = better match)
      combinedSuggestions.sort((a, b) => a.distance - b.distance);

      setSuggestions(combinedSuggestions);
      setShowSuggestions(combinedSuggestions.length > 0);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleSearchQueryChange = (text) => {
    setSearchQuery(text);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Debounce: wait 300ms after user stops typing
    const timeoutId = setTimeout(() => {
      fetchSuggestions(text);
    }, 300);
    
    setSearchTimeout(timeoutId);
  };

  const selectSuggestion = (suggestion) => {
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
    setSuggestions([]);
    
    if (suggestion.type === 'category') {
      setSelectedCategory({
        id: suggestion.actualId,
        name: suggestion.name,
      });
    }
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
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!showSuggestions}
      >
        <TouchableWithoutFeedback onPress={() => setShowSuggestions(false)}>
          <View style={{ flex: 1 }}>
        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Find Food Near You</Text>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for food, restaurant, or cuisine..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={handleSearchQueryChange}
              onFocus={() => {
                if (searchQuery.trim().length >= 2 && suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <ScrollView 
                  style={styles.suggestionsList}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled={true}
                >
                  {suggestions.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion.id}
                      style={styles.suggestionItem}
                      onPress={() => selectSuggestion(suggestion)}
                    >
                      <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
                      <View style={styles.suggestionTextContainer}>
                        <Text style={styles.suggestionName}>{suggestion.name}</Text>
                        <View style={styles.suggestionBottomRow}>
                          <Text style={styles.suggestionType}>
                            {suggestion.type === 'category' ? 'Category' : 'Food Item'}
                          </Text>
                          {suggestion.distance > 0 && (
                            <Text style={styles.didYouMeanText}>Did you mean this?</Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

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
                    <View style={styles.foodCardTopRow}>
                      <Text style={styles.foodCardName}>{item.name}</Text>
                      <TouchableOpacity
                        style={styles.menuButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          openMenu(item);
                        }}
                      >
                        <Text style={styles.menuButtonText}>⋮</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.foodCardType}>{item.category_name || 'Food Item'}</Text>
                    <Text style={styles.foodCardPrice}>
                      ₹{item.price?.toFixed(2)}
                    </Text>
                    
                    {/* Star Rating */}
                    {item.average_rating > 0 && (
                      <View style={styles.ratingContainer}>
                        <StarRating 
                          rating={item.average_rating} 
                          size={16}
                          showNumber={false}
                        />
                        <Text style={styles.ratingText}>
                          {item.average_rating.toFixed(1)} ({item.total_reviews} {item.total_reviews === 1 ? 'review' : 'reviews'})
                        </Text>
                      </View>
                    )}
                    
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

                {/* Three-dot menu */}
                {menuVisible === item.id && (
                  <Modal
                    visible={true}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={closeMenu}
                  >
                    <TouchableOpacity
                      style={styles.menuOverlay}
                      activeOpacity={1}
                      onPress={closeMenu}
                    >
                      <View style={styles.menuDropdown}>
                        <TouchableOpacity
                          style={styles.menuItem}
                          onPress={() => openReviewModal(item)}
                        >
                          <Text style={styles.menuItemIcon}>⭐</Text>
                          <Text style={styles.menuItemText}>Rate & Review</Text>
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity
                          style={styles.menuItem}
                          onPress={() => openReportModal(item)}
                        >
                          <Text style={styles.menuItemIcon}>🚩</Text>
                          <Text style={styles.menuItemText}>Report</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  </Modal>
                )}

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
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>

      {/* Purchase Modal */}
      {selectedPurchaseItem && (
        <PurchaseModal
          visible={purchaseModalVisible}
          onClose={() => setPurchaseModalVisible(false)}
          foodItem={selectedPurchaseItem}
          onSuccess={() => {
            Alert.alert('Request Sent!', 'The seller will be notified. You will get a notification when they approve. 🔔');
            searchNearby(); // Refresh results
          }}
        />
      )}

      {/* Review Modal */}
      {selectedFoodItem && (
        <ReviewModal
          visible={reviewModalVisible}
          onClose={() => setReviewModalVisible(false)}
          foodItem={selectedFoodItem}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      {/* Report Modal */}
      {selectedFoodItem && (
        <ReportModal
          visible={reportModalVisible}
          onClose={() => setReportModalVisible(false)}
          foodItem={selectedFoodItem}
        />
      )}
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
    position: 'relative',
    zIndex: 1000,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  searchContainer: {
    position: 'relative',
    zIndex: 1000,
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
  suggestionsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: 250,
    zIndex: 1001,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  suggestionsList: {
    maxHeight: 250,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  suggestionBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suggestionType: {
    fontSize: 12,
    color: '#999',
  },
  didYouMeanText: {
    fontSize: 11,
    color: '#FF6B35',
    fontStyle: 'italic',
    fontWeight: '500',
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
  foodCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  foodCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    flex: 1,
  },
  menuButton: {
    padding: 4,
    marginLeft: 8,
  },
  menuButtonText: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuDropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  ratingContainer: {
    marginTop: 4,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
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
