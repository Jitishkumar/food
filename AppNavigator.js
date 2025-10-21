import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, Platform, View, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// Import screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import NearbyScreen from './screens/NearbyScreen';
import OwnerDashboard from './screens/OwnerDashboard';
import AddBusinessScreen from './screens/AddBusinessScreen';
import AddFoodItemScreen from './screens/AddFoodItemScreen';
import SpecialFoodsScreen from './screens/SpecialFoodsScreen';
import BusinessDetailScreen from './screens/BusinessDetailScreen';
import CategoriesScreen from './screens/CategoriesScreen';
import ProfileScreen from './screens/ProfileScreen';
import ManageBusinessScreen from './screens/ManageBusinessScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Bar Component (matching websitew design)
const CustomTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  const getTabIcon = (routeName, focused) => {
    switch (routeName) {
      case 'Home':
        return focused ? '🍽️' : '🍴';
      case 'Nearby':
        return focused ? '🏪' : '🏬';
      default:
        return '🍽️';
    }
  };

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80 + (insets.bottom > 0 ? insets.bottom : 20),
        paddingBottom: insets.bottom > 0 ? insets.bottom : 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
      }}
    >
      {/* Tab buttons container */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingTop: 8,
          paddingHorizontal: 20,
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 4,
              }}
            >
              <View style={{ alignItems: 'center' }}>
                {/* Icon container */}
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isFocused
                      ? 'rgba(255, 107, 53, 0.15)'
                      : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 26 }}>
                    {getTabIcon(route.name, isFocused)}
                  </Text>
                </View>

                {/* Label */}
                <Text
                  style={{
                    color: isFocused ? '#FF6B35' : '#888',
                    fontSize: 11,
                    fontWeight: isFocused ? '600' : 'normal',
                    marginTop: 4,
                  }}
                >
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const OwnerStack = () => (
  <Stack.Navigator 
    screenOptions={{ 
      headerShown: false,
      cardStyle: { backgroundColor: '#fff' }
    }}
  >
    <Stack.Screen name="OwnerDashboard" component={OwnerDashboard} />
    <Stack.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ 
        headerShown: true, 
        title: 'My Profile',
        headerLeft: null // Disable back button
      }}
    />
    <Stack.Screen 
      name="AddBusiness" 
      component={AddBusinessScreen}
      options={{ headerShown: true, title: 'Add Business' }}
    />
    <Stack.Screen 
      name="AddFoodItem" 
      component={AddFoodItemScreen}
      options={{ headerShown: true, title: 'Add Food Item' }}
    />
    <Stack.Screen 
      name="BusinessDetail" 
      component={BusinessDetailScreen}
      options={{ headerShown: true, title: 'Business Details' }}
    />
    <Stack.Screen
      name="Categories"
      component={CategoriesScreen}
      options={{ headerShown: true, title: 'Categories' }}
    />
    <Stack.Screen
      name="ManageBusiness"
      component={ManageBusinessScreen}
      options={{ headerShown: true, title: 'Manage Business' }}
    />
  </Stack.Navigator>
);

// Home stack for nested navigation
const HomeStack = () => (
  <Stack.Navigator 
    screenOptions={{ 
      headerShown: false,
      cardStyle: { backgroundColor: '#fff' }
    }}
  >
    <Stack.Screen name="HomeScreen" component={HomeScreen} />
    <Stack.Screen 
      name="SpecialFoods" 
      component={SpecialFoodsScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="BusinessDetail" 
      component={BusinessDetailScreen}
      options={{ headerShown: true, title: 'Business Details' }}
    />
    <Stack.Screen
      name="Categories"
      component={CategoriesScreen}
      options={{ headerShown: true, title: 'Categories' }}
    />
    <Stack.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ 
        headerShown: true, 
        title: 'My Profile',
        headerLeft: null // Disable back button
      }}
    />
  </Stack.Navigator>
);

// Nearby stack for nested navigation
const NearbyStack = () => (
  <Stack.Navigator 
    screenOptions={{ 
      headerShown: false,
      cardStyle: { backgroundColor: '#fff' }
    }}
  >
    <Stack.Screen name="NearbyScreen" component={NearbyScreen} />
    <Stack.Screen 
      name="BusinessDetail" 
      component={BusinessDetailScreen}
      options={{ headerShown: true, title: 'Business Details' }}
    />
    <Stack.Screen
      name="Categories"
      component={CategoriesScreen}
      options={{ headerShown: true, title: 'Categories' }}
    />
  </Stack.Navigator>
);

// Customer tabs with custom bottom navigation
const CustomerTabs = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{
      headerShown: false,
      tabBarHideOnKeyboard: true,
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeStack}
      options={{
        tabBarLabel: 'Food Items',
      }}
    />
    <Tab.Screen
      name="Nearby"
      component={NearbyStack}
      options={{
        tabBarLabel: 'Nearby Places',
      }}
    />
  </Tab.Navigator>
);

const AppNavigator = ({ user, userType }) => {
  if (!user) {
    return (
      <SafeAreaProvider>
        <AuthStack />
      </SafeAreaProvider>
    );
  }

  if (userType === 'owner') {
    return (
      <SafeAreaProvider>
        <OwnerStack />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <CustomerTabs />
    </SafeAreaProvider>
  );
};

export default AppNavigator;