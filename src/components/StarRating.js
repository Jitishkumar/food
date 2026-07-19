import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function StarRating({ 
  rating = 0, 
  onRatingChange = null, 
  size = 24, 
  interactive = false,
  showNumber = true 
}) {
  const renderStars = () => {
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      const filled = i <= Math.floor(rating);
      const halfFilled = i === Math.ceil(rating) && rating % 1 >= 0.5;
      
      stars.push(
        <TouchableOpacity
          key={i}
          disabled={!interactive}
          onPress={() => interactive && onRatingChange && onRatingChange(i)}
          style={styles.starButton}
        >
          <Text style={[styles.star, { fontSize: size }]}>
            {filled ? '★' : halfFilled ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return stars;
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {renderStars()}
      </View>
      {showNumber && rating > 0 && (
        <Text style={styles.ratingNumber}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starButton: {
    marginRight: 2,
  },
  star: {
    color: '#FFD700',
  },
  ratingNumber: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
});
