import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { observer } from 'mobx-react-lite';
import { AppStackParamList } from './app/navigators/types';
import { AIProvider } from './app/components/AIProvider';

// Import screens
import { HomeScreen } from './app/screens/HomeScreen';
import { EquipmentScreen } from './app/screens/EquipmentScreen';
import { MarketplaceScreen } from './app/screens/MarketplaceScreen';
import { ProfileScreen } from './app/screens/ProfileScreen';
import { AddEquipmentScreen } from './app/screens/AddEquipmentScreen';
import { CropAnalysisScreen } from './app/screens/CropAnalysisScreen';
import { EquipmentDetailsScreen } from './app/screens/EquipmentDetailsScreen';
import { ProductDetailsScreen } from './app/screens/ProductDetailsScreen';
import { AddProductScreen } from './app/screens/AddProductScreen';
import { PaymentScreen } from './app/screens/PaymentScreen';
import { PaymentStatusScreen } from './app/screens/PaymentStatusScreen';
import { PaymentHistoryScreen } from './app/screens/PaymentHistoryScreen';
import { CropDetailsScreen } from './app/screens/CropDetailsScreen';

// Import store provider and create root store
import { RootStoreProvider } from './app/models/helpers/useStores';
import { RootStoreModel } from './app/models/RootStore';

const Stack = createNativeStackNavigator<AppStackParamList>();

// Initialize root store
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
  equipmentStore: {},
  marketplaceStore: {},
  cropStore: {},
  paymentStore: {}
});

// Initialize mock data after store creation
rootStore.equipmentStore.addEquipment({
  id: "1",
  name: "Tractor",
  description: "Modern farming tractor",
  type: "Heavy Machinery",
  dailyRate: 100,
  images: ["tractor.jpg"],
  ownerId: "2",
  location: "Kampala",
  createdAt: new Date().toISOString()
});

rootStore.equipmentStore.addEquipment({
  id: "2",
  name: "Harvester",
  description: "Grain harvester",
  type: "Heavy Machinery",
  dailyRate: 150,
  images: ["harvester.jpg"],
  ownerId: "2",
  location: "Kampala",
  createdAt: new Date().toISOString()
});

rootStore.marketplaceStore.addProduct({
  id: "1",
  name: "Fresh Tomatoes",
  description: "Organic tomatoes",
  price: 2.5,
  quantity: 100,
  unit: "kg",
  category: "crops",
  sellerId: "1",
  images: ["tomatoes.jpg"],
  location: "Kampala",
  createdAt: new Date().toISOString(),
  status: "available"
});

const App = observer(() => {
  return (
    <RootStoreProvider value={rootStore}>
      <SafeAreaProvider>
        <AIProvider>
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
                name="AddEquipment" 
                component={AddEquipmentScreen} 
                options={{ title: 'Add Equipment' }} 
              />
              <Stack.Screen 
                name="EquipmentDetails" 
                component={EquipmentDetailsScreen} 
                options={{ title: 'Equipment Details' }} 
              />
              <Stack.Screen 
                name="Marketplace" 
                component={MarketplaceScreen} 
                options={{ title: 'Marketplace' }} 
              />
              <Stack.Screen 
                name="ProductDetails" 
                component={ProductDetailsScreen} 
                options={{ title: 'Product Details' }} 
              />
              <Stack.Screen 
                name="AddProduct" 
                component={AddProductScreen} 
                options={{ title: 'Add Product' }} 
              />
              <Stack.Screen 
                name="Profile" 
                component={ProfileScreen} 
                options={{ title: 'My Profile' }} 
              />
              <Stack.Screen 
                name="CropAnalysis" 
                component={CropAnalysisScreen} 
                options={{ title: 'Analyze Crop' }} 
              />
              <Stack.Screen 
                name="CropDetails" 
                component={CropDetailsScreen} 
                options={{ title: 'Analysis Results' }} 
              />
              <Stack.Screen 
                name="Payment" 
                component={PaymentScreen} 
                options={{ title: 'Make Payment' }} 
              />
              <Stack.Screen 
                name="PaymentStatus" 
                component={PaymentStatusScreen} 
                options={{
                  title: 'Payment Status',
                  gestureEnabled: false,
                  headerLeft: () => null, // Disable back button during payment
                }}
              />
              <Stack.Screen 
                name="PaymentHistory" 
                component={PaymentHistoryScreen} 
                options={{ title: 'Payment History' }} 
              />
            </Stack.Navigator>
          </NavigationContainer>
        </AIProvider>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </RootStoreProvider>
  );
});

export default App;
