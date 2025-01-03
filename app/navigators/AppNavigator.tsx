import React from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { observer } from "mobx-react-lite"
import { useStores } from "../models/helpers/useStores"

// Screens
import { LoginScreen } from "../screens/LoginScreen"
import { HomeScreen } from "../screens/HomeScreen"
import { CropAnalysisScreen } from "../screens/CropAnalysisScreen"
import { CropDetailsScreen } from "../screens/CropDetailsScreen"
import { EquipmentScreen } from "../screens/EquipmentScreen"
import { EquipmentDetailsScreen } from "../screens/EquipmentDetailsScreen"
import { MarketplaceScreen } from "../screens/MarketplaceScreen"
import { ProductDetailsScreen } from "../screens/ProductDetailsScreen"
import { ProfileScreen } from "../screens/ProfileScreen"
import { AddProductScreen } from "../screens/AddProductScreen"
import { EditProductScreen } from "../screens/EditProductScreen"

export type AppStackParamList = {
  Login: undefined
  Home: undefined
  CropAnalysis: undefined
  CropDetails: { cropId: string }
  Equipment: undefined
  EquipmentDetails: { equipmentId: string }
  Marketplace: undefined
  ProductDetails: { productId: string }
  Profile: undefined
  AddProduct: undefined
  EditProduct: { productId: string }
}

const Stack = createStackNavigator<AppStackParamList>()

export const AppNavigator = observer(() => {
  const { userStore } = useStores()

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: "#4CAF50"
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold"
          }
        }}
      >
        {!userStore.isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: "SafiFarm" }}
            />
            <Stack.Screen
              name="CropAnalysis"
              component={CropAnalysisScreen}
              options={{ title: "Crop Analysis" }}
            />
            <Stack.Screen
              name="CropDetails"
              component={CropDetailsScreen}
              options={{ title: "Analysis Results" }}
            />
            <Stack.Screen
              name="Equipment"
              component={EquipmentScreen}
              options={{ title: "Equipment Rental" }}
            />
            <Stack.Screen
              name="EquipmentDetails"
              component={EquipmentDetailsScreen}
              options={{ title: "Equipment Details" }}
            />
            <Stack.Screen
              name="Marketplace"
              component={MarketplaceScreen}
              options={{ title: "Marketplace" }}
            />
            <Stack.Screen
              name="ProductDetails"
              component={ProductDetailsScreen}
              options={{ title: "Product Details" }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: "My Profile" }}
            />
            <Stack.Screen
              name="AddProduct"
              component={AddProductScreen}
              options={{ title: "Add Product" }}
            />
            <Stack.Screen
              name="EditProduct"
              component={EditProductScreen}
              options={{ title: "Edit Product" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
})

AppNavigator.displayName = "AppNavigator" 