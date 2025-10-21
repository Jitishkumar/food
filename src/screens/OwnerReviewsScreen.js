import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase-config';

export default function OwnerReviewsScreen({ navigation }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReviews();
    }, [])
  );

  const loadReviews = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get all businesses owned by this user
      const { data: businesses, error: businessError } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id);

      if (businessError) throw businessError;

      const businessIds = businesses.map(b => b.id);

      // Get all reviews for these businesses
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (
            full_name
          ),
          businesses:business_id (
            business_name
          ),
          food_items:food_item_id (
            name
          )
        `)
        .in('business_id', businessIds)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      setReviews(reviewsData || []);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleReviewPress = (review) => {
    if (review.food_item_id) {
      // Navigate to the business detail which shows food items
      navigation.navigate('BusinessDetail', { 
        businessId: review.business_id,
        highlightFoodId: review.food_item_id 
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadReviews} />
        }
      >
        {reviews.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>⭐</Text>
            <Text style={styles.emptyStateText}>
              No reviews yet. Reviews from customers will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.reviewsList}>
            {reviews.map((review) => (
              <TouchableOpacity
                key={review.id}
                style={styles.reviewCard}
                onPress={() => handleReviewPress(review)}
              >
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewHeaderLeft}>
                    <Text style={styles.businessName}>
                      {review.businesses?.business_name}
                    </Text>
                    {review.food_items && (
                      <Text style={styles.foodName}>
                        📍 {review.food_items.name}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.reviewDate}>
                    {formatDate(review.created_at)}
                  </Text>
                </View>

                <View style={styles.ratingContainer}>
                  <Text style={styles.stars}>{renderStars(review.rating)}</Text>
                  <Text style={styles.ratingText}>{review.rating}/5</Text>
                </View>

                {review.comment && (
                  <Text style={styles.comment}>{review.comment}</Text>
                )}

                <View style={styles.reviewFooter}>
                  <Text style={styles.customerName}>
                    👤 {review.profiles?.full_name || 'Anonymous'}
                  </Text>
                  {review.food_item_id && (
                    <Text style={styles.viewProduct}>View Product →</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
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
  content: {
    flex: 1,
  },
  reviewsList: {
    padding: 16,
  },
  reviewCard: {
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
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  foodName: {
    fontSize: 14,
    color: '#666',
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stars: {
    fontSize: 16,
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  comment: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  customerName: {
    fontSize: 13,
    color: '#666',
  },
  viewProduct: {
    fontSize: 13,
    color: '#4a90e2',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    marginTop: 40,
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
