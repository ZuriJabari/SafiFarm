import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert
} from "react-native"
import { observer } from "mobx-react-lite"
import { useNavigation } from "@react-navigation/native"
import { useStores } from "../models/helpers/useStores"
import { colors } from "../theme"
import * as ImagePicker from "expo-image-picker"

export const AddEquipmentScreen = observer(() => {
  const navigation = useNavigation()
  const { equipmentStore, userStore } = useStores()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    dailyRate: "",
    weeklyRate: "",
    monthlyRate: "",
    location: userStore.user?.location || "",
    images: [] as string[],
    specifications: {} as Record<string, string>
  })

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    })

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, result.assets[0].uri]
      }))
    }
  }

  const handleSubmit = () => {
    if (!formData.name || !formData.description || !formData.type || !formData.dailyRate) {
      Alert.alert("Error", "Please fill in all required fields")
      return
    }

    try {
      equipmentStore.addEquipment({
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        type: formData.type,
        dailyRate: parseFloat(formData.dailyRate),
        weeklyRate: formData.weeklyRate ? parseFloat(formData.weeklyRate) : undefined,
        monthlyRate: formData.monthlyRate ? parseFloat(formData.monthlyRate) : undefined,
        ownerId: userStore.user?.id || "",
        location: formData.location,
        images: formData.images,
        specifications: formData.specifications,
        availability: "available",
        condition: "excellent"
      })
      
      Alert.alert("Success", "Equipment added successfully", [
        { text: "OK", onPress: () => navigation.goBack() }
      ])
    } catch (error) {
      Alert.alert("Error", "Failed to add equipment. Please try again.")
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
          placeholder="Equipment name"
        />

        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
          placeholder="Equipment description"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Type *</Text>
        <TextInput
          style={styles.input}
          value={formData.type}
          onChangeText={(text) => setFormData(prev => ({ ...prev, type: text }))}
          placeholder="Equipment type"
        />

        <Text style={styles.label}>Daily Rate (USD) *</Text>
        <TextInput
          style={styles.input}
          value={formData.dailyRate}
          onChangeText={(text) => setFormData(prev => ({ ...prev, dailyRate: text }))}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Weekly Rate (USD)</Text>
        <TextInput
          style={styles.input}
          value={formData.weeklyRate}
          onChangeText={(text) => setFormData(prev => ({ ...prev, weeklyRate: text }))}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Monthly Rate (USD)</Text>
        <TextInput
          style={styles.input}
          value={formData.monthlyRate}
          onChangeText={(text) => setFormData(prev => ({ ...prev, monthlyRate: text }))}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={formData.location}
          onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
          placeholder="Equipment location"
        />

        <TouchableOpacity style={styles.imageButton} onPress={handleImagePick}>
          <Text style={styles.imageButtonText}>Add Images</Text>
        </TouchableOpacity>
        <Text style={styles.imagesCount}>{formData.images.length} images selected</Text>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Add Equipment</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  imageButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  imageButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  imagesCount: {
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
})
