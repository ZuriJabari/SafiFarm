import React from "react"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { CropAnalysisScreen } from "../screens/CropAnalysisScreen"
import { CropDetailsScreen } from "../screens/CropDetailsScreen"
import { PaymentScreen } from "../screens/PaymentScreen"
import { PaymentStatusScreen } from "../screens/PaymentStatusScreen"
import { PaymentHistoryScreen } from "../screens/PaymentHistoryScreen"

export type AppStackParamList = {
  CropAnalysis: { cropId?: string };
  CropDetails: { cropId: string };
  Payment: { amount?: number; description?: string };
  PaymentStatus: { paymentId: string };
  PaymentHistory: undefined
}

const Stack = createNativeStackNavigator<AppStackParamList>()

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        gestureEnabled: true,
        headerStyle: {
          backgroundColor: "#4CAF50"
        },
        headerTintColor: "#fff"
      }}
    >
      <Stack.Screen
        name="CropAnalysis"
        component={CropAnalysisScreen}
        options={{ title: "Analyze Crop" }}
      />
      <Stack.Screen
        name="CropDetails"
        component={CropDetailsScreen}
        options={{ title: "Analysis Results" }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ title: "Make Payment" }}
      />
      <Stack.Screen
        name="PaymentStatus"
        component={PaymentStatusScreen}
        options={{
          title: "Payment Status",
          gestureEnabled: false,
          headerLeft: () => null, // Disable back button during payment
        }}
      />
      <Stack.Screen
        name="PaymentHistory"
        component={PaymentHistoryScreen}
        options={{ title: "Payment History" }}
      />
    </Stack.Navigator>
  )
} 