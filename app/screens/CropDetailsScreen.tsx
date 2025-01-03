import React from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Share
} from "react-native"
import { observer } from "mobx-react-lite"
import { useRoute } from "@react-navigation/native"
import { useStores } from "../models/helpers/useStores"

export const CropDetailsScreen = observer(() => {
  const route = useRoute<any>()
  const { cropStore } = useStores()
  const crop = cropStore.getCropById(route.params?.cropId)

  if (!crop) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Crop not found</Text>
      </View>
    )
  }

  const latestAnalysis = crop.analyses[crop.analyses.length - 1]

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Crop Analysis Results:\n
Disease: ${latestAnalysis?.disease || "None detected"}\n
Confidence: ${latestAnalysis?.confidence ? Math.round(latestAnalysis.confidence * 100) + "%" : "N/A"}\n
Recommendations:\n${latestAnalysis?.recommendations.join("\n") || "No recommendations available"}`
      })
    } catch (error) {
      console.error("Error sharing results:", error)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{crop.name}</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareButtonText}>Share Results</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={{ uri: crop.images[crop.images.length - 1] }}
            style={styles.image}
          />
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{crop.status}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analysis Results</Text>
          {latestAnalysis ? (
            <>
              <View style={styles.resultItem}>
                <Text style={styles.label}>Disease:</Text>
                <Text style={styles.value}>{latestAnalysis.disease || "None detected"}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.label}>Confidence:</Text>
                <Text style={styles.value}>
                  {latestAnalysis.confidence
                    ? Math.round(latestAnalysis.confidence * 100) + "%"
                    : "N/A"}
                </Text>
              </View>
              <View style={styles.recommendationsContainer}>
                <Text style={styles.label}>Recommendations:</Text>
                {latestAnalysis.recommendations.map((recommendation, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.recommendationText}>{recommendation}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.noDataText}>No analysis data available</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Crop Information</Text>
          <View style={styles.resultItem}>
            <Text style={styles.label}>Type:</Text>
            <Text style={styles.value}>{crop.type}</Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.label}>Planting Date:</Text>
            <Text style={styles.value}>
              {new Date(crop.plantingDate).toLocaleDateString()}
            </Text>
          </View>
          {crop.expectedHarvestDate && (
            <View style={styles.resultItem}>
              <Text style={styles.label}>Expected Harvest:</Text>
              <Text style={styles.value}>
                {new Date(crop.expectedHarvestDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  content: {
    padding: 20
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333"
  },
  shareButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20
  },
  shareButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500"
  },
  imageContainer: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover"
  },
  statusBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    textTransform: "capitalize"
  },
  section: {
    marginBottom: 25,
    backgroundColor: "#f8f8f8",
    padding: 15,
    borderRadius: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15
  },
  resultItem: {
    flexDirection: "row",
    marginBottom: 10
  },
  label: {
    fontSize: 16,
    color: "#666",
    width: 120
  },
  value: {
    fontSize: 16,
    color: "#333",
    flex: 1
  },
  recommendationsContainer: {
    marginTop: 10
  },
  recommendationItem: {
    flexDirection: "row",
    marginBottom: 8,
    paddingLeft: 10
  },
  bullet: {
    fontSize: 16,
    color: "#4CAF50",
    marginRight: 8
  },
  recommendationText: {
    fontSize: 16,
    color: "#333",
    flex: 1
  },
  noDataText: {
    fontSize: 16,
    color: "#999",
    fontStyle: "italic"
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginTop: 50
  }
}) 