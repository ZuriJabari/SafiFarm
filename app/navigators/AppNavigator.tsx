import React from "react"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { CropAnalysisScreen } from "../screens/CropAnalysisScreen"
import { CropDetailsScreen } from "../screens/CropDetailsScreen"

export type AppStackParamList = {
  CropAnalysis: { cropId?: string };
  CropDetails: { cropId: string };
}

const Stack = createNativeStackNavigator<AppStackParamList>()

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
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
    </Stack.Navigator>
  )
} 