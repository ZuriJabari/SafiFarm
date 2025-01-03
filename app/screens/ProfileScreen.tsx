import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  ImageSourcePropType,
} from "react-native"
import * as ImagePicker from "expo-image-picker"
import { observer } from "mobx-react-lite"
import { useStores } from "../models/helpers/useStores"
import { colors } from "../theme"
import { Purchase, MarketplaceListing } from "../models/Marketplace"
import { EquipmentRental } from "../models/Equipment"

type TabType = "profile" | "purchases" | "rentals" | "listings"

interface EditedUser {
  name: string
  phone: string
  location: string
  farmSize: string
}

const profilePlaceholder: ImageSourcePropType = require("../assets/icons/profile-placeholder.png")

export const ProfileScreen = observer(() => {
  const { userStore, marketplaceStore, equipmentStore } = useStores()
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("profile")
  const [editedUser, setEditedUser] = useState<EditedUser>({
    name: userStore.user?.name || "",
    phone: userStore.user?.phone || "",
    location: userStore.user?.location || "",
    farmSize: userStore.user?.farmSize?.toString() || "",
  })

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    })

    if (!result.canceled && result.assets[0]) {
      userStore.updateProfile({ ...userStore.user, profileImage: result.assets[0].uri })
    }
  }

  const handleSaveProfile = () => {
    userStore.updateProfile({
      ...userStore.user,
      name: editedUser.name,
      phone: editedUser.phone,
      location: editedUser.location,
      farmSize: parseInt(editedUser.farmSize, 10),
    })
    setIsEditing(false)
  }

  const renderProfileTab = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity
        testID="edit-profile-image"
        style={styles.imageContainer}
        onPress={handleImagePick}
      >
        <Image
          testID="profile-image"
          source={
            userStore.user?.profileImage
              ? { uri: userStore.user.profileImage }
              : profilePlaceholder
          }
          style={styles.profileImage}
        />
        <View style={styles.editIconContainer}>
          <Text style={styles.editIcon}>📷</Text>
        </View>
      </TouchableOpacity>

      {isEditing ? (
        <View style={styles.editForm}>
          <TextInput
            style={styles.input}
            value={editedUser.name}
            onChangeText={(text: string) => setEditedUser({ ...editedUser, name: text })}
            placeholder="Name"
          />
          <TextInput
            style={styles.input}
            value={editedUser.phone}
            onChangeText={(text: string) => setEditedUser({ ...editedUser, phone: text })}
            placeholder="Phone"
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            value={editedUser.location}
            onChangeText={(text: string) => setEditedUser({ ...editedUser, location: text })}
            placeholder="Location"
          />
          <TextInput
            style={styles.input}
            value={editedUser.farmSize}
            onChangeText={(text: string) => setEditedUser({ ...editedUser, farmSize: text })}
            placeholder="Farm Size (acres)"
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.button} onPress={handleSaveProfile}>
            <Text style={styles.buttonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{userStore.user?.name}</Text>
          <Text style={styles.detail}>{userStore.user?.email}</Text>
          <Text style={styles.detail}>{userStore.user?.phone}</Text>
          <Text style={styles.detail}>{userStore.user?.location}</Text>
          <Text style={styles.detail}>Farm Size: {userStore.user?.farmSize} acres</Text>
          <TouchableOpacity style={styles.button} onPress={() => setIsEditing(true)}>
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )

  const renderPurchasesTab = () => (
    <ScrollView style={styles.tabContent}>
      {marketplaceStore.userPurchases.length > 0 ? (
        marketplaceStore.userPurchases.map((purchase: Purchase) => (
          <View key={purchase.id} style={styles.listItem}>
            <Text style={styles.itemTitle}>{purchase.productName}</Text>
            <Text style={styles.itemDetail}>{purchase.quantity} items</Text>
            <Text style={styles.itemDetail}>Total: ${purchase.totalCost}</Text>
            <Text style={styles.status}>{purchase.status}</Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No purchases yet</Text>
        </View>
      )}
    </ScrollView>
  )

  const renderRentalsTab = () => (
    <ScrollView style={styles.tabContent}>
      {equipmentStore.userRentals.length > 0 ? (
        equipmentStore.userRentals.map((rental: EquipmentRental) => (
          <View key={rental.id} style={styles.listItem}>
            <Text style={styles.itemTitle}>{rental.equipmentName}</Text>
            <Text style={styles.itemDetail}>From: {new Date(rental.startDate).toLocaleDateString()}</Text>
            <Text style={styles.itemDetail}>To: {new Date(rental.endDate).toLocaleDateString()}</Text>
            <Text style={styles.itemDetail}>Total: ${rental.totalCost}</Text>
            <Text style={styles.status}>{rental.status}</Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No rentals yet</Text>
        </View>
      )}
    </ScrollView>
  )

  const renderListingsTab = () => (
    <ScrollView style={styles.tabContent}>
      {marketplaceStore.userListings.length > 0 ? (
        marketplaceStore.userListings.map((listing) => (
          <View key={listing.id} style={styles.listItem}>
            <Text style={styles.itemTitle}>{listing.name}</Text>
            <Text style={styles.itemDetail}>{listing.quantity} {listing.unit} available</Text>
            <Text style={styles.itemDetail}>Price: ${listing.price}/{listing.unit}</Text>
            <Text style={styles.status}>{listing.status}</Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No listings yet</Text>
        </View>
      )}
    </ScrollView>
  )

  if (userStore.isLoading) {
    return (
      <View style={styles.loadingContainer} testID="loading-indicator">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "profile" && styles.activeTab]}
          onPress={() => setActiveTab("profile")}
        >
          <Text style={styles.tabText}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "purchases" && styles.activeTab]}
          onPress={() => setActiveTab("purchases")}
        >
          <Text style={styles.tabText}>Purchases</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "rentals" && styles.activeTab]}
          onPress={() => setActiveTab("rentals")}
        >
          <Text style={styles.tabText}>Rentals</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "listings" && styles.activeTab]}
          onPress={() => setActiveTab("listings")}
        >
          <Text style={styles.tabText}>Listings</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "profile" && renderProfileTab()}
      {activeTab === "purchases" && renderPurchasesTab()}
      {activeTab === "rentals" && renderRentalsTab()}
      {activeTab === "listings" && renderListingsTab()}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editIconContainer: {
    position: "absolute",
    right: "35%",
    bottom: 0,
    backgroundColor: colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  editIcon: {
    fontSize: 16,
  },
  profileInfo: {
    alignItems: "center",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: colors.text,
  },
  detail: {
    fontSize: 16,
    marginBottom: 4,
    color: colors.textDim,
  },
  editForm: {
    width: "100%",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  listItem: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    color: colors.text,
  },
  itemDetail: {
    fontSize: 14,
    color: colors.textDim,
    marginBottom: 2,
  },
  status: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
})