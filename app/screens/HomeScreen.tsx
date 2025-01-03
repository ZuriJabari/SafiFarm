import React from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions
} from "react-native"
import { observer } from "mobx-react-lite"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useStores } from "../models/helpers/useStores"
import { AppStackParamList } from "../navigators/AppNavigator"

type NavigationProp = NativeStackNavigationProp<AppStackParamList>

const Feature = ({ title, description, onPress, icon }) => {
  const { width } = useWindowDimensions()
  const itemWidth = (width - 60) / 2

  return (
    <TouchableOpacity
      style={[styles.featureItem, { width: itemWidth }]}
      onPress={onPress}
    >
      <Image source={icon} style={styles.featureIcon} />
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </TouchableOpacity>
  )
}

export const HomeScreen = observer(() => {
  const navigation = useNavigation<NavigationProp>()
  const { userStore } = useStores()

  const features = [
    {
      title: "Crop Analysis",
      description: "Analyze crop health using AI",
      icon: require("../assets/icons/crop-analysis.png"),
      screen: "CropAnalysis"
    },
    {
      title: "Equipment",
      description: "Rent farming equipment",
      icon: require("../assets/icons/equipment.png"),
      screen: "Equipment"
    },
    {
      title: "Marketplace",
      description: "Buy and sell produce",
      icon: require("../assets/icons/marketplace.png"),
      screen: "Marketplace"
    },
    {
      title: "Profile",
      description: "Manage your account",
      icon: require("../assets/icons/profile.png"),
      screen: "Profile"
    }
  ]

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>{userStore.user?.name}</Text>
        </View>
        <TouchableOpacity onPress={() => userStore.logout()}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <Feature
            key={index}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
            onPress={() => navigation.navigate(feature.screen as any)}
          />
        ))}
      </View>
    </ScrollView>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff"
  },
  greeting: {
    fontSize: 16,
    color: "#666"
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333"
  },
  logout: {
    color: "#4CAF50",
    fontSize: 16
  },
  featuresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 15,
    justifyContent: "space-between"
  },
  featureItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  featureIcon: {
    width: 48,
    height: 48,
    marginBottom: 10
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5
  },
  featureDescription: {
    fontSize: 14,
    color: "#666"
  }
}) 