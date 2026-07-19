import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { supabase } from '../../supabase-config';

export default function PurchaseModal({ visible, onClose, foodItem, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    if (visible && foodItem) {
      loadBusinessDetails();
    }
  }, [visible, foodItem]);

  const loadBusinessDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('business_name, payment_qr_url, upi_id, phone_number, whatsapp_number, address, city, state')
        .eq('id', foodItem.business_id)
        .single();

      if (error) throw error;
      
      // Use food item's payment details if available, otherwise use business details
      const finalData = {
        ...data,
        payment_qr_url: foodItem.payment_qr_url || data.payment_qr_url,
        upi_id: foodItem.upi_id || data.upi_id,
      };
      
      setBusiness(finalData);
    } catch (error) {
      console.error('Error loading business:', error);
    }
  };

  const requestPayment = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate unique request code
      const requestCode = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      // Get payment details (food item's or business's)
      const paymentQRUrl = foodItem.payment_qr_url || business?.payment_qr_url;
      const upiId = foodItem.upi_id || business?.upi_id;

      // Create payment request (will trigger notification for owner automatically)
      const { data, error } = await supabase
        .from('payment_requests')
        .insert([{
          food_item_id: foodItem.id,
          business_id: foodItem.business_id,
          customer_id: user.id,
          status: 'pending',
          request_code: requestCode,
          quantity: 1,
          total_amount: foodItem.price,
          payment_qr_url: paymentQRUrl,
          upi_id: upiId,
        }])
        .select()
        .single();

      if (error) throw error;

      Alert.alert(
        'Request Sent! 🎉',
        `Your request code is ${requestCode}. The seller has been notified and will approve your request soon. You'll get a notification! 🔔`,
        [{ text: 'OK', onPress: () => {
          onSuccess && onSuccess();
          onClose();
        }}]
      );
    } catch (error) {
      console.error('Error requesting payment:', error);
      Alert.alert('Error', error.message || 'Failed to send payment request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openPhone = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  const openWhatsApp = (number) => {
    Linking.openURL(`https://wa.me/${number.replace(/[^0-9]/g, '')}`);
  };

  const openMaps = () => {
    if (!business) return;
    const address = `${business.address}, ${business.city}, ${business.state}`;
    const url = Platform.OS === 'ios'
      ? `maps://app?q=${encodeURIComponent(address)}`
      : `geo:0,0?q=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <ScrollView>
            <Text style={styles.title}>{foodItem?.name}</Text>
            
            {/* Price */}
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Price:</Text>
              <Text style={styles.priceText}>₹{foodItem?.price?.toFixed(2)}</Text>
            </View>

            {/* Business Info */}
            {business && (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>📍 Location</Text>
                  <Text style={styles.infoText}>{business.business_name}</Text>
                  <Text style={styles.infoText}>{business.address}</Text>
                  <Text style={styles.infoText}>{business.city}, {business.state}</Text>
                  <TouchableOpacity style={styles.linkButton} onPress={openMaps}>
                    <Text style={styles.linkButtonText}>🗺️ Open in Maps</Text>
                  </TouchableOpacity>
                </View>

                {/* Contact */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>📞 Contact Seller</Text>
                  {business.phone_number && (
                    <TouchableOpacity 
                      style={styles.contactButton}
                      onPress={() => openPhone(business.phone_number)}
                    >
                      <Text style={styles.contactButtonText}>📞 Call: {business.phone_number}</Text>
                    </TouchableOpacity>
                  )}
                  {business.whatsapp_number && (
                    <TouchableOpacity 
                      style={styles.contactButton}
                      onPress={() => openWhatsApp(business.whatsapp_number)}
                    >
                      <Text style={styles.contactButtonText}>💬 WhatsApp: {business.whatsapp_number}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxTitle}>How it works:</Text>
              <Text style={styles.infoBoxText}>1. Click "Request Payment" below</Text>
              <Text style={styles.infoBoxText}>2. Seller will approve your request</Text>
              <Text style={styles.infoBoxText}>3. You'll get a notification with QR code</Text>
              <Text style={styles.infoBoxText}>4. Pay using the QR code</Text>
              <Text style={styles.infoBoxText}>5. Earn 2 coins! 🪙</Text>
            </View>

            {/* Payment Request Button */}
            <TouchableOpacity
              style={[styles.requestButton, loading && styles.requestButtonDisabled]}
              onPress={requestPayment}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.requestButtonText}>💳 Request Payment</Text>
              )}
            </TouchableOpacity>
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
    padding: 24,
    maxHeight: '90%',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 10,
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    marginTop: 8,
  },
  priceBox: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  linkButton: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    alignItems: 'center',
  },
  linkButtonText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
  },
  contactButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF6B35',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  contactButtonText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoBoxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 8,
  },
  infoBoxText: {
    fontSize: 14,
    color: '#e65100',
    marginBottom: 4,
  },
  requestButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  requestButtonDisabled: {
    opacity: 0.6,
  },
  requestButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});
