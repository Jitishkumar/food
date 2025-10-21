import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { supabase } from '../../supabase-config';

export default function SpecialFoodsScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [specialFoods, setSpecialFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [selectedRegionType, setSelectedRegionType] = useState('all');
  const [loading, setLoading] = useState(false);

  const regionTypes = [
    { value: 'all', label: 'All' },
    { value: 'district', label: 'District' },
    { value: 'state', label: 'State' },
    { value: 'country', label: 'Country' },
  ];

  useEffect(() => {
    loadSpecialFoods();
  }, []);

  useEffect(() => {
    filterFoods();
  }, [searchQuery, selectedRegionType, specialFoods]);

  const loadSpecialFoods = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('special_foods')
        .select('*, categories(name, icon)')
        .order('is_featured', { ascending: false })
        .order('name');

      if (error) throw error;
      setSpecialFoods(data || []);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterFoods = () => {
    let filtered = specialFoods;

    if (selectedRegionType !== 'all') {
      filtered = filtered.filter((food) => food.region_type === selectedRegionType);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (food) =>
          food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          food.region.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredFoods(filtered);
  };

  const handleFoodSelect = (food) => {
    Alert.alert(
      food.name,
      `Famous in: ${food.region}\n\nFind this food nearby?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Search Nearby',
          onPress: () => navigation.navigate('Home', { searchQuery: food.name }),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⭐ Special Foods</Text>
      </View>

      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by food name or region..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {regionTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.filterButton,
                selectedRegionType === type.value && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedRegionType(type.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedRegionType === type.value && styles.filterTextActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        {filteredFoods.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔍</Text>
            <Text style={styles.emptyStateText}>
              {loading ? 'Loading...' : 'No special foods found'}
            </Text>
          </View>
        ) : (
          filteredFoods.map((food) => (
            <TouchableOpacity
              key={food.id}
              style={styles.foodCard}
              onPress={() => handleFoodSelect(food)}
            >
              {food.is_featured && (
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredText}>⭐ Featured</Text>
                </View>
              )}
              <View style={styles.foodCardContent}>
                <Text style={styles.foodIcon}>
                  {food.categories?.icon || '🍽️'}
                </Text>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  <Text style={styles.foodRegion}>📍 {food.region}</Text>
                  <Text style={styles.foodType}>
                    {food.region_type.charAt(0).toUpperCase() + food.region_type.slice(1)} Special
                  </Text>
                  {food.description && (
                    <Text style={styles.foodDescription} numberOfLines={2}>
                      {food.description}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
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
  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFA500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featuredText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  foodCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  foodIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  foodRegion: {
    fontSize: 14,
    color: '#FF6B35',
    marginBottom: 4,
  },
  foodType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  foodDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
