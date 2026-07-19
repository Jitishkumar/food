import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../supabase-config';

export default function AddFoodItemScreen({ route, navigation }) {
  const { businessId } = route.params;
  const [foodName, setFoodName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState(null);
  const [paymentQRImage, setPaymentQRImage] = useState(null);
  const [inventoryCount, setInventoryCount] = useState('');
  const [allowPurchase, setAllowPurchase] = useState(true);
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [paymentQR, setPaymentQR] = useState('');
  const [upiId, setUpiId] = useState('');
  const [customUpiId, setCustomUpiId] = useState('');

  useEffect(() => {
    loadBusinessDetails();
  }, []);

  const loadBusinessDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('city, state, address, payment_qr_url, upi_id')
        .eq('id', businessId)
        .single();

      if (error) throw error;
      if (data) {
        setCity(data.city || '');
        setState(data.state || '');
        setBusinessAddress(data.address || '');
        setPaymentQR(data.payment_qr_url || '');
        setUpiId(data.upi_id || '');
      }
    } catch (error) {
      console.error('Error loading business details:', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const pickPaymentQRImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPaymentQRImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    // Trim values before validation
    const trimmedFoodName = foodName.trim();
    const trimmedCategory = category.trim();
    const trimmedCity = city.trim();
    const trimmedState = state.trim();

    // Debug: Log all values
    console.log('=== FORM VALIDATION ===');
    console.log('Food Name:', foodName, '(trimmed:', trimmedFoodName, ')');
    console.log('Category:', category, '(trimmed:', trimmedCategory, ')');
    console.log('City:', city, '(trimmed:', trimmedCity, ')');
    console.log('State:', state, '(trimmed:', trimmedState, ')');
    console.log('Price:', price);
    console.log('Inventory:', inventoryCount);

    // Check each field individually with specific messages
    if (!trimmedFoodName) {
      Alert.alert('Missing Food Name', 'Please enter a food name at the top of the form');
      return;
    }

    if (!trimmedCategory) {
      Alert.alert('Missing Category', 'Please enter a food category');
      return;
    }

    if (!trimmedCity) {
      Alert.alert('Missing City', 'City is required. It should be auto-filled from your business.');
      return;
    }

    if (!trimmedState) {
      Alert.alert('Missing State', 'State is required. It should be auto-filled from your business.');
      return;
    }

    // All validations passed
    console.log('✅ All validations passed!');

    setLoading(true);
    try {
      // Step 1: Find or create the category
      let categoryId = null;
      
      // First, try to find existing category (case-insensitive)
      const { data: existingCategories, error: searchError } = await supabase
        .from('categories')
        .select('id, name')
        .ilike('name', trimmedCategory);

      if (searchError) {
        console.error('Error searching categories:', searchError);
        throw searchError;
      }

      if (existingCategories && existingCategories.length > 0) {
        // Category exists, use it
        categoryId = existingCategories[0].id;
        console.log('✅ Found existing category:', existingCategories[0].name, categoryId);
      } else {
        // Category doesn't exist, create it
        const { data: newCategory, error: createError } = await supabase
          .from('categories')
          .insert([{ 
            name: trimmedCategory,
            icon: '🍽️' // default icon
          }])
          .select()
          .single();

        if (createError) {
          console.error('Error creating category:', createError);
          throw createError;
        }

        categoryId = newCategory.id;
        console.log('✅ Created new category:', newCategory.name, categoryId);
      }

      // Step 2: Upload image if selected
      let imageUrl = null;
      if (image) {
        imageUrl = image.uri; // In production, upload to cloud storage
      }

      // Step 2b: Upload payment QR image if selected
      let paymentQRUrl = null;
      if (paymentQRImage) {
        paymentQRUrl = paymentQRImage.uri; // In production, upload to cloud storage
      } else if (paymentQR) {
        paymentQRUrl = paymentQR; // Use business payment QR if no custom one
      }

      // Step 3: Prepare the data object with category_id
      const foodItemData = {
        business_id: businessId,
        name: trimmedFoodName,
        description: description.trim() || null,
        category_id: categoryId,
        price: price && price.trim() ? parseFloat(price) : null,
        image_url: imageUrl,
        inventory_count: inventoryCount && inventoryCount.trim() ? parseInt(inventoryCount) : null,
        allow_purchase: allowPurchase,
        city: trimmedCity,
        state: trimmedState,
        payment_qr_url: paymentQRUrl,
        upi_id: customUpiId.trim() || upiId || null,
      };

      console.log('📤 Submitting food item:', foodItemData);

      const { data, error } = await supabase
        .from('food_items')
        .insert([foodItemData])
        .select();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Success! Data:', data);
      Alert.alert('Success', 'Food item added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('❌ Error adding food item:', error);
      Alert.alert('Error', error.message || 'Failed to add food item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Add Food Item</Text>

        <View style={styles.requiredNote}>
          <Text style={styles.requiredNoteText}>* = Required fields</Text>
        </View>

        <Text style={styles.fieldLabel}>Food Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter food name (e.g., Chicken Biryani)"
          placeholderTextColor="#999"
          value={foodName}
          onChangeText={setFoodName}
        />

        {businessAddress && (
          <View style={styles.businessInfoSection}>
            <Text style={styles.label}>Business Address (Read-only)</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              placeholder="Address"
              placeholderTextColor="#999"
              value={businessAddress}
              editable={false}
              multiline
            />
          </View>
        )}

        <View style={styles.cityStateRow}>
          <View style={styles.halfInputContainer}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Enter city"
              placeholderTextColor="#999"
              value={city}
              onChangeText={setCity}
            />
          </View>
          <View style={styles.halfInputContainer}>
            <Text style={styles.label}>State *</Text>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Enter state"
              placeholderTextColor="#999"
              value={state}
              onChangeText={setState}
            />
          </View>
        </View>

        <Text style={styles.label}>Category *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter category (e.g., Desserts, Drinks, Main Course)"
          placeholderTextColor="#999"
          value={category}
          onChangeText={setCategory}
        />

        <Text style={styles.fieldLabel}>Price (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter price in ₹ (e.g., 250)"
          placeholderTextColor="#999"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />

        <Text style={styles.fieldLabel}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your food item..."
          placeholderTextColor="#999"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
        
        <Text style={styles.fieldLabel}>Inventory Count (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Inventory count (e.g., 10 cakes available)"
          placeholderTextColor="#999"
          value={inventoryCount}
          onChangeText={setInventoryCount}
          keyboardType="numeric"
        />
        
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Allow Purchase Requests:</Text>
          <Switch
            value={allowPurchase}
            onValueChange={setAllowPurchase}
            trackColor={{ false: '#e0e0e0', true: '#FF6B35' }}
            thumbColor={allowPurchase ? '#fff' : '#f4f3f4'}
          />
        </View>

        {/* Payment Details - Auto-filled from business */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentSectionTitle}>💳 Payment Details</Text>
          
          {(paymentQR || upiId) && (
            <View style={styles.paymentInfoBox}>
              <Text style={styles.paymentInfoTitle}>From Business Profile:</Text>
              {paymentQR && <Text style={styles.paymentInfoText}>QR: {paymentQR}</Text>}
              {upiId && <Text style={styles.paymentInfoText}>UPI: {upiId}</Text>}
            </View>
          )}

          <Text style={styles.label}>Payment QR Code Image (Optional)</Text>
          <TouchableOpacity style={styles.imageButton} onPress={pickPaymentQRImage}>
            <Text style={styles.imageButtonText}>
              {paymentQRImage ? '✅ QR Image Selected' : '📷 Add Payment QR Image'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>UPI ID (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter custom UPI ID for this item"
            placeholderTextColor="#999"
            value={customUpiId}
            onChangeText={setCustomUpiId}
          />

          <View style={styles.paymentNote}>
            <Text style={styles.paymentNoteText}>
              💡 Tip: Add payment QR image and UPI ID here for this specific item, or leave empty to use business payment details.
            </Text>
          </View>
        </View>

        {!paymentQR && !paymentQRImage && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️ No payment details! Add QR image above or set payment details in your business profile. Without payment details, customers cannot complete purchases.
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <Text style={styles.imageButtonText}>
            {image ? '✅ Image Selected' : '📷 Add Food Photo'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Adding Food Item...' : 'Add Food Item'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    marginTop: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 8,
    marginTop: 8,
  },
  requiredNote: {
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  requiredNoteText: {
    fontSize: 13,
    color: '#e65100',
    fontWeight: '600',
  },
  categoryScroll: {
    marginBottom: 16,
    maxHeight: 120,
  },
  categoryScrollContent: {
    paddingRight: 20,
  },
  selectedCategoryBox: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  selectedCategoryLabel: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedCategoryName: {
    fontSize: 18,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginRight: 12,
    alignItems: 'center',
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
    transform: [{ scale: 1.05 }],
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  businessInfoSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cityStateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfInputContainer: {
    flex: 1,
  },
  halfInput: {
    flex: 1,
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  paymentSection: {
    marginBottom: 16,
  },
  paymentSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 12,
  },
  paymentInfoBox: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  paymentInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  paymentInfoText: {
    fontSize: 13,
    color: '#2e7d32',
    marginBottom: 4,
  },
  paymentNote: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  paymentNoteText: {
    fontSize: 13,
    color: '#1976d2',
    lineHeight: 18,
  },
  warningBox: {
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  warningText: {
    fontSize: 14,
    color: '#e65100',
    lineHeight: 20,
  },
  imageButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  imageButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
