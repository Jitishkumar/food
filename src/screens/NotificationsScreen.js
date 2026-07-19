import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Image,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { supabase } from '../../supabase-config';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPaymentRequest, setSelectedPaymentRequest] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'customer' or 'owner'

  useEffect(() => {
    loadNotifications();
    checkUserRole();
    
    // Subscribe to new notifications
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user owns any businesses
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);

      setUserRole(businesses && businesses.length > 0 ? 'owner' : 'customer');
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationPress = async (notification) => {
    markAsRead(notification.id);

    if (notification.type === 'payment_request' && userRole === 'owner') {
      // Owner sees payment request - load full details
      loadPaymentRequestDetails(notification.related_id);
    } else if (notification.type === 'payment_approved') {
      // Customer sees approved request - load QR and payment details
      loadApprovedPaymentDetails(notification.related_id);
    }
  };

  const loadPaymentRequestDetails = async (paymentRequestId) => {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select(`
          *,
          food_items (
            name,
            price,
            image_url
          )
        `)
        .eq('id', paymentRequestId)
        .single();

      if (error) throw error;
      setSelectedPaymentRequest(data);
    } catch (error) {
      console.error('Error loading payment request:', error);
      Alert.alert('Error', 'Failed to load payment request details');
    }
  };

  const loadApprovedPaymentDetails = async (paymentRequestId) => {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select(`
          *,
          food_items (
            name,
            price,
            image_url,
            payment_qr_url,
            upi_id
          )
        `)
        .eq('id', paymentRequestId)
        .single();

      if (error) throw error;
      
      if (data.status === 'approved') {
        setSelectedPaymentRequest(data);
        setShowQRModal(true);
      } else if (data.status === 'completed') {
        Alert.alert('Already Completed', 'This payment has already been marked as complete.');
      } else {
        Alert.alert('Info', `Request status: ${data.status}`);
      }
    } catch (error) {
      console.error('Error loading payment details:', error);
      Alert.alert('Error', 'Failed to load payment details');
    }
  };

  const approvePaymentRequest = async () => {
    if (!selectedPaymentRequest) return;

    try {
      const { error } = await supabase
        .from('payment_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', selectedPaymentRequest.id);

      if (error) throw error;

      Alert.alert('✅ Approved!', 'Payment request has been approved. Customer will be notified.');
      setSelectedPaymentRequest(null);
      loadNotifications();
    } catch (error) {
      console.error('Error approving payment:', error);
      Alert.alert('Error', 'Failed to approve payment request');
    }
  };

  const rejectPaymentRequest = async () => {
    if (!selectedPaymentRequest) return;

    Alert.alert(
      'Reject Request?',
      'Are you sure you want to reject this payment request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('payment_requests')
                .update({ status: 'rejected' })
                .eq('id', selectedPaymentRequest.id);

              if (error) throw error;

              Alert.alert('Rejected', 'Payment request has been rejected.');
              setSelectedPaymentRequest(null);
              loadNotifications();
            } catch (error) {
              console.error('Error rejecting payment:', error);
              Alert.alert('Error', 'Failed to reject payment request');
            }
          },
        },
      ]
    );
  };

  const completePayment = async () => {
    if (!selectedPaymentRequest) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // 1. Update payment request status to completed
      const { error: paymentError } = await supabase
        .from('payment_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', selectedPaymentRequest.id);

      if (paymentError) throw paymentError;

      // 2. Get or create user_coins record
      let { data: userCoins, error: coinsError } = await supabase
        .from('user_coins')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (coinsError && coinsError.code === 'PGRST116') {
        // No coins record exists, create one
        const { data: newCoins, error: createError } = await supabase
          .from('user_coins')
          .insert([{
            user_id: user.id,
            balance: 0,
            earned_total: 0,
            spent_total: 0,
          }])
          .select()
          .single();

        if (createError) throw createError;
        userCoins = newCoins;
      } else if (coinsError) {
        throw coinsError;
      }

      // 3. Award 2 coins
      const { error: updateError } = await supabase
        .from('user_coins')
        .update({
          balance: userCoins.balance + 2,
          earned_total: userCoins.earned_total + 2,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // 4. Create coin transaction record
      const { error: transactionError } = await supabase
        .from('coin_transactions')
        .insert([{
          user_id: user.id,
          amount: 2,
          type: 'earned',
          source: 'purchase',
          related_id: selectedPaymentRequest.id,
          description: `Earned 2 coins for purchasing ${selectedPaymentRequest.food_items?.name}`,
        }]);

      if (transactionError) throw transactionError;

      // Success!
      Alert.alert(
        '🎉 Payment Complete!',
        'You earned 2 coins! 🪙🪙\n\nCheck your balance in the More tab.',
        [{ 
          text: 'OK', 
          onPress: () => {
            setShowQRModal(false);
            setSelectedPaymentRequest(null);
            loadNotifications();
          }
        }]
      );
    } catch (error) {
      console.error('Error completing payment:', error);
      Alert.alert('Error', error.message || 'Failed to complete payment');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const renderNotification = ({ item }) => {
    const isUnread = !item.is_read;
    const typeIcon = {
      payment_request: '🛒',
      payment_approved: '✅',
      payment_rejected: '❌',
    }[item.type] || '🔔';

    return (
      <TouchableOpacity
        style={[styles.notificationCard, isUnread && styles.unreadNotification]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.notificationIcon}>
          <Text style={styles.iconText}>{typeIcon}</Text>
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <Text style={styles.notificationTime}>
            {new Date(item.created_at).toLocaleString()}
          </Text>
        </View>
        {isUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔔 Notifications</Text>
      </View>

      {notifications.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📭</Text>
          <Text style={styles.emptyStateText}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Payment Request Details Modal (for owners) */}
      {selectedPaymentRequest && !showQRModal && (
        <Modal
          visible={true}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedPaymentRequest(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedPaymentRequest(null)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>

              <ScrollView>
                <Text style={styles.modalTitle}>Payment Request</Text>

                <View style={styles.requestInfoBox}>
                  <Text style={styles.requestCode}>
                    Code: {selectedPaymentRequest.request_code}
                  </Text>
                  <Text style={styles.requestItem}>
                    {selectedPaymentRequest.food_items?.name}
                  </Text>
                  <Text style={styles.requestAmount}>
                    ₹{selectedPaymentRequest.total_amount?.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={approvePaymentRequest}
                  >
                    <Text style={styles.actionButtonText}>✅ Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={rejectPaymentRequest}
                  >
                    <Text style={styles.actionButtonText}>❌ Reject</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* QR Code Modal (for customers after approval) */}
      {showQRModal && selectedPaymentRequest && (
        <Modal
          visible={true}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setShowQRModal(false);
            setSelectedPaymentRequest(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowQRModal(false);
                  setSelectedPaymentRequest(null);
                }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>

              <ScrollView>
                <Text style={styles.modalTitle}>✅ Payment Approved!</Text>

                <View style={styles.requestInfoBox}>
                  <Text style={styles.requestItem}>
                    {selectedPaymentRequest.food_items?.name}
                  </Text>
                  <Text style={styles.requestAmount}>
                    ₹{selectedPaymentRequest.total_amount?.toFixed(2)}
                  </Text>
                  <Text style={styles.requestCode}>
                    Code: {selectedPaymentRequest.request_code}
                  </Text>
                </View>

                {/* Payment QR Code */}
                {selectedPaymentRequest.food_items?.payment_qr_url && (
                  <View style={styles.qrSection}>
                    <Text style={styles.sectionTitle}>📱 Scan to Pay:</Text>
                    <Image
                      source={{ uri: selectedPaymentRequest.food_items.payment_qr_url }}
                      style={styles.qrImage}
                      resizeMode="contain"
                    />
                  </View>
                )}

                {/* UPI ID */}
                {selectedPaymentRequest.food_items?.upi_id && (
                  <View style={styles.upiSection}>
                    <Text style={styles.sectionTitle}>💳 Or use UPI ID:</Text>
                    <View style={styles.upiBox}>
                      <Text style={styles.upiId}>
                        {selectedPaymentRequest.food_items.upi_id}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Instructions */}
                <View style={styles.instructionBox}>
                  <Text style={styles.instructionTitle}>📋 Instructions:</Text>
                  <Text style={styles.instructionText}>
                    1. Scan the QR code or use the UPI ID above
                  </Text>
                  <Text style={styles.instructionText}>
                    2. Complete the payment
                  </Text>
                  <Text style={styles.instructionText}>
                    3. Click "Payment Complete" below
                  </Text>
                  <Text style={styles.instructionText}>
                    4. Earn 2 coins! 🪙🪙
                  </Text>
                </View>

                {/* Payment Complete Button */}
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={completePayment}
                >
                  <Text style={styles.completeButtonText}>
                    ✅ Payment Complete
                  </Text>
                </TouchableOpacity>

                <View style={styles.rewardBox}>
                  <Text style={styles.rewardText}>
                    💰 You'll earn 2 coins after marking as complete!
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
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
  listContent: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadNotification: {
    backgroundColor: '#fff3e0',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B35',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
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
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    marginTop: 8,
  },
  requestInfoBox: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  requestCode: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  requestItem: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  requestAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#4caf50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  qrImage: {
    width: 250,
    height: 250,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  upiSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  upiBox: {
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF6B35',
    width: '100%',
  },
  upiId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
    textAlign: 'center',
  },
  instructionBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 6,
    paddingLeft: 8,
  },
  completeButton: {
    backgroundColor: '#4caf50',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  rewardBox: {
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 14,
    color: '#e65100',
    fontWeight: '600',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
  },
  infoBoxText: {
    fontSize: 14,
    color: '#1976d2',
    textAlign: 'center',
  },
});
