import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { supabase } from '../supabase-config';

export default function BusinessDetailScreen({ route, navigation }) {
  const { businessId } = route.params;
  const [business, setBusiness] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadBusinessDetails();
  }, []);

  const loadBusinessDetails = async () => {
    try {
      // Get business details
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single();

      if (businessError) throw businessError;
      setBusiness(businessData);

      // Get food items
      const { data: foodData, error: foodError } = await supabase
        .from('food_items')
        .select('*, categories(name, icon)')
        .eq('business_id', businessId)
        .eq('is_available', true);

      if (foodError) throw foodError;
      setFoodItems(foodData || []);

      // Get reviews
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .select('*, profiles(full_name)')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reviewError) throw reviewError;
      setReviews(reviewData || []);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = () => {
    if (!business) return;
    
    const url = Platform.OS === 'ios'
      ? `maps://app?daddr=${business.latitude},${business.longitude}`
      : `geo:${business.latitude},${business.longitude}?q=${business.latitude},${business.longitude}(${business.business_name})`;
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open maps');
    });
  };

  const callBusiness = () => {
    if (!business) return;
    Linking.openURL(`tel:${business.phone_number}`);
  };

  const submitReview = async () => {
    if (userRating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('reviews')
        .insert([
          {
            user_id: user.id,
            business_id: businessId,
            rating: userRating,
            comment: comment.trim(),
          },
        ]);

      if (error) throw error;

      Alert.alert('Success', 'Review submitted!');
      setUserRating(0);
      setComment('');
      loadBusinessDetails();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 'N/A';

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!business) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Business not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Business Header */}
      <View style={styles.header}>
        <Text style={styles.businessName}>{business.business_name}</Text>
        <Text style={styles.businessType}>{business.business_type}</Text>
        <Text style={styles.rating}>⭐ {avgRating} ({reviews.length} reviews)</Text>
        {business.description && (
          <Text style={styles.description}>{business.description}</Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={callBusiness}>
          <Text style={styles.actionButtonText}>📞 Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={openInMaps}>
          <Text style={styles.actionButtonText}>🗺️ Directions</Text>
        </TouchableOpacity>
      </View>

      {/* Contact Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <Text style={styles.infoText}>📞 {business.phone_number}</Text>
        {business.address && (
          <Text style={styles.infoText}>📍 {business.address}</Text>
        )}
      </View>

      {/* Food Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Menu ({foodItems.length} items)</Text>
        {foodItems.map((item) => (
          <View key={item.id} style={styles.foodItem}>
            <Text style={styles.foodIcon}>{item.categories?.icon || '🍽️'}</Text>
            <View style={styles.foodItemInfo}>
              <Text style={styles.foodItemName}>{item.name}</Text>
              {item.description && (
                <Text style={styles.foodItemDesc}>{item.description}</Text>
              )}
              {item.price && (
                <Text style={styles.foodItemPrice}>₹{item.price}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Reviews */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        {reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewAuthor}>{review.profiles?.full_name}</Text>
              <Text style={styles.reviewRating}>{'⭐'.repeat(review.rating)}</Text>
            </View>
            {review.comment && (
              <Text style={styles.reviewComment}>{review.comment}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Add Review */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add Your Review</Text>
        <View style={styles.ratingSelector}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setUserRating(star)}
            >
              <Text style={styles.star}>
                {star <= userRating ? '⭐' : '☆'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.submitButton} onPress={submitReview}>
          <Text style={styles.submitButtonText}>Submit Review</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
    color: '#ff0000',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 40,
  },
  businessName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  businessType: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  rating: {
    fontSize: 16,
    color: '#FFA500',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  foodIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  foodItemInfo: {
    flex: 1,
  },
  foodItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  foodItemDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  foodItemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  reviewCard: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  reviewRating: {
    fontSize: 14,
  },
  reviewComment: {
    fontSize: 14,
    color: '#666',
  },
  ratingSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  star: {
    fontSize: 32,
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
