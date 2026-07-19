import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase-config';
import Sidebar from '../components/Sidebar';

export default function MoreTabScreen({ navigation }) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    loadCoins();
  }, []);

  // Reload coins when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadCoins();
    }, [])
  );

  const loadCoins = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_coins')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setCoins(data.balance);
      }
    } catch (error) {
      console.error('Error loading coins:', error);
    }
  };

  const serviceOptions = [
    { 
      id: 'jobs', 
      title: 'Jobs & Employment', 
      icon: '💼', 
      description: 'Find job opportunities',
      category: 'Jobs'
    },
    { 
      id: 'rooms', 
      title: 'Rooms for Rent', 
      icon: '🏠', 
      description: 'Find rooms and housing',
      category: 'Rooms for Rent'
    },
    { 
      id: 'freelance', 
      title: 'Freelance Services', 
      icon: '💻', 
      description: 'Website, apps, design work',
      category: 'Freelance'
    },
    { 
      id: 'drivers', 
      title: 'Drivers Available', 
      icon: '🚗', 
      description: 'Hire drivers with salary',
      category: 'Drivers'
    },
    { 
      id: 'events', 
      title: 'Event Services', 
      icon: '🎭', 
      description: 'Dancers, performers, event staff',
      category: 'Event Services'
    },
    { 
      id: 'home', 
      title: 'Home Services', 
      icon: '🔧', 
      description: 'Repairs, cleaning, maintenance',
      category: 'Home Services'
    },
    { 
      id: 'tutoring', 
      title: 'Tutoring & Education', 
      icon: '📚', 
      description: 'Find tutors and teachers',
      category: 'Tutoring'
    },
    { 
      id: 'other', 
      title: 'Other Services', 
      icon: '⭐', 
      description: 'Miscellaneous services',
      category: 'Other Services'
    },
  ];

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <Sidebar 
        navigation={navigation}
        isVisible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <Text style={styles.menuButtonText}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>⚡ More Services</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Coins Card */}
        <TouchableOpacity 
          style={styles.coinsCard}
          onPress={() => Alert.alert('Coming Soon', 'Coins history screen will be available soon!')}
        >
          <View style={styles.coinsLeft}>
            <Text style={styles.coinsIcon}>🪙</Text>
            <View>
              <Text style={styles.coinsTitle}>My Coins</Text>
              <Text style={styles.coinsSubtitle}>Earn coins with every purchase</Text>
            </View>
          </View>
          <Text style={styles.coinsBalance}>{coins}</Text>
        </TouchableOpacity>

        {/* Service Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse Services</Text>
          <Text style={styles.sectionSubtitle}>
            Find jobs, rooms, freelancers, and more in your area
          </Text>

          {serviceOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.serviceCard}
              onPress={() => {
                Alert.alert(
                  'Coming Soon!',
                  `${option.title} marketplace will be available soon. We're building an amazing experience for you!`
                );
                // Future: navigation.navigate('ServiceMarketplace', { category: option.category });
              }}
            >
              <View style={styles.serviceLeft}>
                <Text style={styles.serviceIcon}>{option.icon}</Text>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceTitle}>{option.title}</Text>
                  <Text style={styles.serviceDescription}>{option.description}</Text>
                </View>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Post Your Service */}
        <TouchableOpacity 
          style={styles.postServiceCard}
          onPress={() => {
            Alert.alert(
              'Coming Soon!',
              'You will be able to post your own services soon. Stay tuned!'
            );
          }}
        >
          <Text style={styles.postServiceIcon}>➕</Text>
          <View>
            <Text style={styles.postServiceTitle}>Post Your Service</Text>
            <Text style={styles.postServiceSubtitle}>
              Offer your skills and services to others
            </Text>
          </View>
        </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginRight: 12,
    padding: 4,
  },
  menuButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  coinsCard: {
    backgroundColor: '#FFD700',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  coinsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinsIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  coinsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  coinsSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  coinsBalance: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  serviceDescription: {
    fontSize: 13,
    color: '#666',
  },
  arrow: {
    fontSize: 28,
    color: '#ccc',
    marginLeft: 8,
  },
  postServiceCard: {
    backgroundColor: '#4CAF50',
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  postServiceIcon: {
    fontSize: 32,
    color: '#fff',
    marginRight: 16,
  },
  postServiceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  postServiceSubtitle: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
  },
});
