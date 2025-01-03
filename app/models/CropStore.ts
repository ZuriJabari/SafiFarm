import { Instance, SnapshotOut, types } from "mobx-state-tree"
import * as tf from "@tensorflow/tfjs"
import { bundleResourceIO } from "@tensorflow/tfjs-react-native"

export const CropAnalysisModel = types.model("CropAnalysis").props({
  id: types.identifier,
  cropId: types.string,
  disease: types.maybe(types.string),
  confidence: types.maybe(types.number),
  recommendations: types.array(types.string),
  timestamp: types.Date
})

export const CropModel = types.model("Crop").props({
  id: types.identifier,
  name: types.string,
  type: types.string,
  plantingDate: types.Date,
  expectedHarvestDate: types.maybe(types.Date),
  status: types.enumeration(["healthy", "diseased", "harvested"]),
  images: types.array(types.string),
  analyses: types.array(CropAnalysisModel)
})

export const CropStoreModel = types
  .model("CropStore")
  .props({
    crops: types.array(CropModel),
    isAnalyzing: types.optional(types.boolean, false),
    model: types.frozen<tf.LayersModel>()
  })
  .views((self) => ({
    getCropById(id: string) {
      return self.crops.find((crop) => crop.id === id)
    }
  }))
  .actions((self) => ({
    async loadModel() {
      try {
        const model = await tf.loadLayersModel(bundleResourceIO(
          require("../../assets/model/model.json"),
          require("../../assets/model/weights.bin")
        ))
        self.model = model
      } catch (error) {
        console.error("Error loading model:", error)
      }
    },
    addCrop(crop: typeof CropModel.Type) {
      self.crops.push(crop)
    },
    async analyzeCrop(cropId: string, imageUri: string) {
      self.isAnalyzing = true
      try {
        // Image preprocessing and model prediction logic here
        // This is a placeholder for the actual implementation
        const analysis = {
          id: String(Date.now()),
          cropId,
          disease: "healthy",
          confidence: 0.95,
          recommendations: ["Continue current care regime"],
          timestamp: new Date()
        }
        const crop = self.getCropById(cropId)
        if (crop) {
          crop.analyses.push(analysis)
        }
      } catch (error) {
        console.error("Error analyzing crop:", error)
      } finally {
        self.isAnalyzing = false
      }
    },
    reset() {
      self.crops.clear()
      self.isAnalyzing = false
    }
  }))

export interface CropStore extends Instance<typeof CropStoreModel> {}
export interface CropStoreSnapshot extends SnapshotOut<typeof CropStoreModel> {} 