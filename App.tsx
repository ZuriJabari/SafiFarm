import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { observer } from 'mobx-react-lite';

// Import screens
import { HomeScreen } from './app/screens/HomeScreen';
import { EquipmentScreen } from './app/screens/EquipmentScreen';
import { MarketplaceScreen } from './app/screens/MarketplaceScreen';
import { ProfileScreen } from './app/screens/ProfileScreen';

// Import store provider and create root store
import { RootStoreProvider } from './app/models/helpers/useStores';
import { RootStoreModel } from './app/models/RootStore';

export type AppStackParamList = {
  Home: undefined;
  CropAnalysis: undefined;
  Equipment: undefined;
  Marketplace: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

// Initialize root store with mock data for development
const rootStore = RootStoreModel.create({
  userStore: {
    user: {
      id: "1",
      email: "farmer@example.com",
      name: "John Farmer",
      phone: "+256123456789",
      location: "Kampala",
      farmSize: 5,
    },
    isAuthenticated: true,
    authToken: "mock-token"
  },
  equipmentStore: {
    equipment: [
      {
        id: "1",
        name: "Tractor",
        description: "Modern farming tractor",
        type: "Heavy Machinery",
        dailyRate: 100,
        weeklyRate: 600,
        monthlyRate: 2000,
        ownerId: "2",
        location: "Kampala",
        images: ["https://example.com/tractor.jpg"],
        specifications: {},
        availability: "available",
        condition: "excellent"
      },
      {
        id: "2",
        name: "Harvester",
        description: "Grain harvester",
        type: "Heavy Machinery",
        dailyRate: 150,
        weeklyRate: 900,
        monthlyRate: 3000,
        ownerId: "2",
        location: "Kampala",
        images: ["https://example.com/harvester.jpg"],
        specifications: {},
        availability: "available",
        condition: "good"
      }
    ],
    rentals: [],
    maintenanceRecords: [],
    isLoading: false
  },
  marketplaceStore: {
    products: [
      {
        id: "1",
        name: "Fresh Tomatoes",
        description: "Organic tomatoes",
        price: 2.5,
        quantity: 100,
        unit: "kg",
        category: "crops",
        sellerId: "1",
        images: ["https://example.com/tomatoes.jpg"],
        location: "Kampala",
        createdAt: new Date().toISOString()
      }
    ],
    isLoading: false
  }
});

const App = observer(() => {
  return (
    <RootStoreProvider value={rootStore}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerShown: true,
              headerStyle: {
                backgroundColor: '#4CAF50', // Green theme for agriculture
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{ title: 'SafiFarm' }} 
            />
            <Stack.Screen 
              name="Equipment" 
              component={EquipmentScreen} 
              options={{ title: 'Equipment Rental' }} 
            />
            <Stack.Screen 
              name="Marketplace" 
              component={MarketplaceScreen} 
              options={{ title: 'Marketplace' }} 
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen} 
              options={{ title: 'My Profile' }} 
            />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </RootStoreProvider>
  );
});

export default App;
