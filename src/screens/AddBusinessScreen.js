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
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../supabase-config';

export default function AddBusinessScreen({ navigation }) {
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('restaurant');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationLocked, setLocationLocked] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(true);

  const businessTypes = [
    { value: 'restaurant', label: '🍽️ Restaurant' },
    { value: 'dhaba', label: '🚛 Dhaba' },
    { value: 'sweet_shop', label: '🍰 Sweet Shop' },
    { value: 'cafe', label: '☕ Cafe' },
    { value: 'bakery', label: '🥖 Bakery' },
    { value: 'street_food', label: '🌮 Street Food' },
  ];

  useEffect(() => {
    // Don't automatically fetch location on load
    setFetchingLocation(false);
  }, []);

  const getCurrentLocation = async () => {
    if (locationLocked) {
      Alert.alert('Location Locked', 'Your business location has been locked and cannot be changed.');
      return;
    }
    
    setFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        setFetchingLocation(false);
        return;
      }

      // Force high accuracy and no caching to ensure we get the actual current location
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 0 // Don't use cached location data
      });
      
      setLocation(currentLocation.coords);

      // Get address from coordinates
      const addressData = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (addressData[0]) {
        const addr = addressData[0];
        setAddress(`${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''}`);
        setCity(addr.city || '');
        setState(addr.region || '');
      }
      
      // Clear any default address that might have been set
      if (!addressData[0]) {
        setAddress('');
        setCity('');
        setState('');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get location');
      setAddress(''); // Clear address on error
    } finally {
      setFetchingLocation(false);
    }
  };
  
  const lockLocation = () => {
    if (!location) {
      Alert.alert('Error', 'Please get your current location first');
      return;
    }
    
    setLocationLocked(true);
    Alert.alert('Location Locked', 'Your business location has been locked. This cannot be changed later.');
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!businessName || !phoneNumber || !location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Upload image if selected
      let imageUrl = null;
      if (image) {
        const fileExt = image.uri.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const formData = new FormData();
        formData.append('file', {
          uri: image.uri,
          name: fileName,
          type: `image/${fileExt}`,
        });

        // Note: You'll need to implement image upload to your storage solution
        // For now, we'll skip the upload
        imageUrl = image.uri;
      }

      const { data, error } = await supabase
        .from('businesses')
        .insert([
          {
            owner_id: user.id,
            business_name: businessName.trim(),
            business_type: businessType,
            phone_number: phoneNumber.trim(),
            address: address.trim(),
            city: city.trim(),
            state: state.trim(),
            latitude: location.latitude,
            longitude: location.longitude,
            description: description.trim(),
            image_url: imageUrl,
          },
        ])
        .select();

      if (error) throw error;

      Alert.alert('Success', 'Business added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message);
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
        <Text style={styles.title}>Add Your Business</Text>

        <TextInput
          style={styles.input}
          placeholder="Business Name *"
          placeholderTextColor="#999"
          value={businessName}
          onChangeText={setBusinessName}
        />

        <Text style={styles.label}>Business Type *</Text>
        <View style={styles.typeGrid}>
          {businessTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeButton,
                businessType === type.value && styles.typeButtonActive,
              ]}
              onPress={() => setBusinessType(type.value)}
            >
              <Text
                style={[
                  styles.typeText,
                  businessType === type.value && styles.typeTextActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Phone Number *"
          placeholderTextColor="#999"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />

        <TextInput
          style={[styles.input, (location || locationLocked) && styles.disabledInput]}
          placeholder="Address (Auto-filled when location is fetched)"
          placeholderTextColor="#999"
          value={address}
          onChangeText={(text) => {
            // Only allow changes if location is not set or locked
            if (!location && !locationLocked) {
              setAddress(text);
            }
          }}
          editable={!location && !locationLocked}
          multiline
        />

        <View style={styles.cityStateRow}>
          <TextInput
            style={[styles.input, styles.halfInput, styles.disabledInput]}
            placeholder="City"
            placeholderTextColor="#999"
            value={city}
            editable={false}
          />
          <TextInput
            style={[styles.input, styles.halfInput, styles.disabledInput]}
            placeholder="State"
            placeholderTextColor="#999"
            value={state}
            editable={false}
          />
        </View>

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description (optional)"
          placeholderTextColor="#999"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <Text style={styles.imageButtonText}>
            {image ? '✅ Image Selected' : '📷 Add Business Photo'}
          </Text>
        </TouchableOpacity>

        <View style={styles.locationInfo}>
          <Text style={styles.locationLabel}>
            📍 {locationLocked ? 'Locked Location:' : 'Current Location:'}
          </Text>
          
          {fetchingLocation ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FF6B35" />
              <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
          ) : (
            <Text style={styles.locationText}>
              {location
                ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
                : 'Location not available'}
            </Text>
          )}
          
          <View style={styles.locationActions}>
            {!locationLocked && (
              <TouchableOpacity 
                style={[styles.locationButton, styles.fetchButton]} 
                onPress={getCurrentLocation}
                disabled={fetchingLocation}
              >
                <Text style={styles.locationButtonText}>
                  📍 Fetch Current Location
                </Text>
              </TouchableOpacity>
            )}
            
            {location && !locationLocked && (
              <TouchableOpacity 
                style={[styles.locationButton, styles.lockButton]} 
                onPress={lockLocation}
              >
                <Text style={styles.locationButtonText}>
                  🔒 Lock Location
                </Text>
              </TouchableOpacity>
            )}
            
            {locationLocked && (
              <View style={styles.lockedBadge}>
                <Text style={styles.lockedText}>🔒 Location Locked</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Adding Business...' : 'Add Business'}
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
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
    borderColor: '#ccc',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  typeButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  typeText: {
    fontSize: 14,
    color: '#666',
  },
  typeTextActive: {
    color: '#fff',
    fontWeight: '600',
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
  locationInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  locationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  locationButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
    marginRight: 8,
  },
  locationButtonText: {
    color: '#FF6B35',
    fontWeight: '600',
    fontSize: 14,
  },
  fetchButton: {
    backgroundColor: '#f0f8ff',
    borderColor: '#4169e1',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  lockButton: {
    backgroundColor: '#FF6B35',
  },
  lockedBadge: {
    backgroundColor: '#e0f2f1',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4db6ac',
  },
  lockedText: {
    color: '#00897b',
    fontWeight: '600',
    fontSize: 14,
  },
  refreshLocation: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  cityStateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  halfInput: {
    flex: 1,
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
