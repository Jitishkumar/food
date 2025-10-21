import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { supabase } from '../../supabase-config';

const ManageBusinessScreen = ({ route, navigation }) => {
  const { businessId } = route.params;

  const [business, setBusiness] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const loadData = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single();

      if (error) throw error;
      setBusiness(data);
      setBusinessName(data.business_name || '');
      setBusinessType(data.business_type || '');
      setPhoneNumber(data.phone_number || '');
      setAddress(data.address || '');
      setDescription(data.description || '');
      setIsActive(data.is_active);

      const { data: foodData, error: foodError } = await supabase
        .from('food_items')
        .select('id, name, is_available, price')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (foodError) throw foodError;
      setFoodItems(foodData || []);
    } catch (error) {
      console.error('Error loading business', error);
      Alert.alert('Error', error.message || 'Failed to load business details');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!businessId) return;

    if (!businessName.trim()) {
      Alert.alert('Validation', 'Business name is required');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Validation', 'Phone number is required');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          business_name: businessName.trim(),
          business_type: businessType.trim(),
          phone_number: phoneNumber.trim(),
          address: address.trim(),
          description: description.trim(),
          is_active: isActive,
        })
        .eq('id', businessId);

      if (error) throw error;

      Alert.alert('Success', 'Business updated successfully');
      await loadData();
    } catch (error) {
      console.error('Error updating business', error);
      Alert.alert('Error', error.message || 'Failed to update business');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Business',
      'Are you sure you want to delete this business? This will remove all associated food items and reviews.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const { error } = await supabase
                .from('businesses')
                .delete()
                .eq('id', businessId);

              if (error) throw error;

              Alert.alert('Deleted', 'Business removed successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting business', error);
              Alert.alert('Error', error.message || 'Failed to delete business');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleAddFood = () => {
    navigation.navigate('AddFoodItem', { businessId });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading business details...</Text>
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Manage Business</Text>
      <Text style={styles.subtitle}>Update business details, availability, and menu.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Business Name</Text>
          <TextInput
            style={styles.input}
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Enter business name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Business Type</Text>
          <TextInput
            style={styles.input}
            value={businessType}
            onChangeText={setBusinessType}
            placeholder="Restaurant, Dhaba, Cafe..."
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            placeholder="Contact number"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={address}
            onChangeText={setAddress}
            placeholder="Street, locality, city"
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your business"
            multiline
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Business Active</Text>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: '#d1d5db', true: '#FF6B35' }}
            thumbColor={isActive ? '#fff' : '#f4f4f5'}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.disabledButton]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Menu Items</Text>
            <Text style={styles.sectionSubTitle}>Manage food items for this business</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddFood}>
            <Text style={styles.addButtonText}>➕ Add Food</Text>
          </TouchableOpacity>
        </View>

        {foodItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyText}>No food items yet.</Text>
            <Text style={styles.emptySubtext}>Add your first item to showcase your menu.</Text>
          </View>
        ) : (
          foodItems.map((item) => (
            <View key={item.id} style={styles.foodRow}>
              <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{item.name}</Text>
                <Text style={styles.foodMeta}>
                  {item.is_available ? '✅ Available' : '❌ Unavailable'}
                  {item.price ? ` • ₹${Number(item.price).toFixed(2)}` : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.foodEditButton}
                onPress={() =>
                  navigation.navigate('AddFoodItem', { businessId, foodItemId: item.id })
                }
              >
                <Text style={styles.foodEditText}>Edit</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity
        style={[styles.deleteButton, deleting && styles.disabledButton]}
        onPress={handleDelete}
        disabled={deleting}
      >
        <Text style={styles.deleteButtonText}>
          {deleting ? 'Deleting...' : 'Delete Business'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
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
  errorText: {
    marginTop: 120,
    textAlign: 'center',
    color: '#b91c1c',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2933',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 6,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2933',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionSubTitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#9aa5b1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1f2933',
    backgroundColor: '#f9fafb',
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2933',
  },
  saveButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  addButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 30,
    paddingHorizontal: 24,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  emptyIcon: {
    fontSize: 42,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2933',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 6,
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  foodInfo: {
    flex: 1,
    marginRight: 12,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2933',
  },
  foodMeta: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  foodEditButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  foodEditText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 30,
  },
  deleteButtonText: {
    color: '#b91c1c',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ManageBusinessScreen;
