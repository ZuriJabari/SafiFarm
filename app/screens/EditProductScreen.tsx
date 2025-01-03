import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator
} from "react-native"
import { observer } from "mobx-react-lite"
import { useNavigation, useRoute } from "@react-navigation/native"
import { useStores } from "../models/helpers/useStores"
import { MaterialIcons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"

export const EditProductScreen = observer(() => {
  const navigation = useNavigation()
  const route = useRoute<any>()
  const { marketplaceStore } = useStores()
  const [loading, setLoading] = useState(false)

  const product = marketplaceStore.getProductById(route.params?.productId)

  // Form state
  const [name, setName] = useState(product?.name || "")
  const [description, setDescription] = useState(product?.description || "")
  const [price, setPrice] = useState(product?.price.toString() || "")
  const [quantity, setQuantity] = useState(product?.quantity.toString() || "")
  const [category, setCategory] = useState(product?.category || "")
  const [images, setImages] = useState<string[]>(product?.images || [])

  useEffect(() => {
    if (!product) {
      Alert.alert("Error", "Product not found")
      navigation.goBack()
    }
  }, [product, navigation])

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8
    })

    if (!result.canceled && result.assets[0].uri) {
      setImages([...images, result.assets[0].uri])
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!name || !description || !price || !quantity || !category || images.length === 0) {
      Alert.alert("Error", "Please fill in all required fields and add at least one image")
      return
    }

    setLoading(true)
    try {
      await marketplaceStore.updateProduct({
        id: product?.id || "",
        name,
        description,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        category,
        images,
        updatedAt: new Date()
      })
      Alert.alert(
        "Success",
        "Product updated successfully",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      )
    } catch (error) {
      Alert.alert("Error", "Failed to update product")
    }
    setLoading(false)
  }

  if (!product) {
    return null
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter product name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter product description"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price (UGX) *</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="Enter price"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Quantity *</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="Enter quantity"
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category *</Text>
          <TextInput
            style={styles.input}
            value={category}
            onChangeText={setCategory}
            placeholder="Enter category"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Images *</Text>
          <ScrollView horizontal style={styles.imageList}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <MaterialIcons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <MaterialIcons name="add-photo-alternate" size={32} color="#666" />
            </TouchableOpacity>
          </ScrollView>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Update Product</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  form: {
    padding: 16
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: "#333"
  },
  textArea: {
    height: 100,
    textAlignVertical: "top"
  },
  imageList: {
    flexDirection: "row",
    marginBottom: 16
  },
  imageContainer: {
    marginRight: 12,
    position: "relative"
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#F44336",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center"
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center"
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center"
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600"
  }
}) 