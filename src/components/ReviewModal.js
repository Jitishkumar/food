import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../supabase-config';

export default function ReviewModal({ visible, onClose, foodItem, onReviewSubmitted }) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [allReviews, setAllReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    if (visible && foodItem) {
      loadUserReview();
      loadAllReviews();
    }
  }, [visible, foodItem]);

  const loadUserReview = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('food_item_reviews')
        .select('*')
        .eq('food_item_id', foodItem.id)
        .eq('user_id', user.id)
        .single();

      if (data) {
        setExistingReview(data);
        setRating(data.rating);
        setReviewText(data.review_text || '');
      }
    } catch (error) {
      console.log('No existing review found');
    }
  };

  const loadAllReviews = async () => {
    setLoadingReviews(true);
    try {
      // First get reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('food_item_reviews')
        .select('*')
        .eq('food_item_id', foodItem.id)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Then get user profiles for each review
      const reviewsWithUsers = await Promise.all(
        (reviewsData || []).map(async (review) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', review.user_id)
            .single();
          
          return {
            ...review,
            user: profile || { email: 'Anonymous' }
          };
        })
      );

      const data = reviewsWithUsers;

      setAllReviews(data || []);
      
      // Calculate average rating
      if (data && data.length > 0) {
        const avg = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
        setAverageRating(avg);
        setTotalReviews(data.length);
      } else {
        setAverageRating(0);
        setTotalReviews(0);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to submit a review.');
        return;
      }

      const reviewData = {
        food_item_id: foodItem.id,
        user_id: user.id,
        rating,
        review_text: reviewText.trim() || null,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (existingReview) {
        // Update existing review
        result = await supabase
          .from('food_item_reviews')
          .update(reviewData)
          .eq('id', existingReview.id);
      } else {
        // Create new review
        result = await supabase
          .from('food_item_reviews')
          .insert([reviewData]);
      }

      if (result.error) throw result.error;

      Alert.alert(
        'Success',
        existingReview ? 'Your review has been updated!' : 'Thank you for your review!',
        [
          {
            text: 'OK',
            onPress: () => {
              if (onReviewSubmitted) onReviewSubmitted();
              handleClose();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setReviewText('');
    setExistingReview(null);
    setAllReviews([]);
    onClose();
  };

  const renderStars = (count, interactive = false) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => interactive && setRating(star)}
            disabled={!interactive}
          >
            <Text style={[styles.star, star <= count && styles.starFilled]}>
              {star <= count ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reviews & Ratings</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Food Item Info */}
            <View style={styles.foodInfo}>
              <Text style={styles.foodName}>{foodItem?.name}</Text>
              <Text style={styles.foodBusiness}>{foodItem?.business_name}</Text>
            </View>

            {/* Overall Rating Summary */}
            <View style={styles.ratingSummary}>
              <View style={styles.ratingDisplay}>
                <Text style={styles.ratingNumber}>
                  {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings'}
                </Text>
                {averageRating > 0 && renderStars(Math.round(averageRating))}
                <Text style={styles.totalReviews}>
                  {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                </Text>
              </View>
            </View>

            {/* Your Review Section */}
            <View style={styles.yourReviewSection}>
              <Text style={styles.sectionTitle}>
                {existingReview ? 'Update Your Review' : 'Write a Review'}
              </Text>
              
              <Text style={styles.label}>Your Rating *</Text>
              {renderStars(rating, true)}

              <Text style={styles.label}>Your Review (Optional)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Share your experience with this food item..."
                placeholderTextColor="#999"
                value={reviewText}
                onChangeText={setReviewText}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text style={styles.charCount}>{reviewText.length}/500</Text>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {existingReview ? 'Update Review' : 'Submit Review'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* All Reviews Section */}
            <View style={styles.allReviewsSection}>
              <Text style={styles.sectionTitle}>All Reviews</Text>
              
              {loadingReviews ? (
                <ActivityIndicator size="large" color="#FF6B35" style={styles.loader} />
              ) : allReviews.length === 0 ? (
                <View style={styles.noReviews}>
                  <Text style={styles.noReviewsText}>No reviews yet</Text>
                  <Text style={styles.noReviewsSubtext}>Be the first to review!</Text>
                </View>
              ) : (
                allReviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View>
                        <Text style={styles.reviewerName}>
                          {review.user?.full_name || review.user?.email?.split('@')[0] || 'Anonymous'}
                        </Text>
                        <Text style={styles.reviewDate}>
                          {formatDate(review.created_at)}
                        </Text>
                      </View>
                      {renderStars(review.rating)}
                    </View>
                    {review.review_text && (
                      <Text style={styles.reviewText}>{review.review_text}</Text>
                    )}
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  foodInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  foodName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  foodBusiness: {
    fontSize: 14,
    color: '#666',
  },
  ratingSummary: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  ratingDisplay: {
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 8,
  },
  totalReviews: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  yourReviewSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  star: {
    fontSize: 32,
    color: '#ddd',
  },
  starFilled: {
    color: '#FFD700',
  },
  textArea: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  allReviewsSection: {
    padding: 20,
  },
  loader: {
    marginVertical: 20,
  },
  noReviews: {
    alignItems: 'center',
    padding: 40,
  },
  noReviewsText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  noReviewsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  reviewCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  reviewText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 8,
  },
});
