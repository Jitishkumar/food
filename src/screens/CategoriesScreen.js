import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../supabase-config';

const CategoriesScreen = ({ navigation, route }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, icon')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await fetchCategories();
    } finally {
      setRefreshing(false);
    }
  }, [fetchCategories]);

  const handleCategorySelect = async (category) => {
    try {
      // First, check if there are any food items in this category
      const { data: foodItems, error } = await supabase
        .from('food_items')
        .select('id')
        .eq('category_id', category.id)
        .limit(1);

      if (error) throw error;

      if (foodItems && foodItems.length > 0) {
        // Navigate to the 'Nearby' tab with the category filter
        navigation.navigate('Home', { 
          screen: 'Nearby',
          params: { 
            selectedCategory: {
              id: category.id,
              name: category.name
            }
          }
        });
      } else {
        // If no food items, show an alert
        Alert.alert(
          'No Food Available',
          `There are currently no food items available in the ${category.name} category.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error checking food items:', error);
      Alert.alert(
        'Error',
        'Failed to check food availability. Please try again.'
      );
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleCategorySelect(item)}
    >
      <Text style={styles.icon}>{item.icon || '🍽️'}</Text>
      <Text style={styles.name}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Browse Categories</Text>
        <Text style={styles.subtitle}>
          Tap a category to discover nearby dishes and restaurants.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.column}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🍽️</Text>
              <Text style={styles.emptyText}>No categories found yet.</Text>
              <Text style={styles.emptySubtext}>
                Add categories from the Supabase dashboard to get started.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ececec',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2933',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  column: {
    justifyContent: 'space-between',
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    marginBottom: 16,
    marginHorizontal: 4,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  icon: {
    fontSize: 36,
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
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
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 6,
  },
});

export default CategoriesScreen;
