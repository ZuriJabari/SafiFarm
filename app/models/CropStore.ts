import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { aiService } from "../services/AIService"

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

const CropStoreModel = types
  .model("CropStore")
  .props({
    crops: types.array(CropModel),
    isAnalyzing: types.optional(types.boolean, false),
    isModelInitialized: types.optional(types.boolean, false)
  })
  .views((self) => ({
    getCropById(id: string) {
      return self.crops.find((crop) => crop.id === id)
    }
  }))
  .actions((self) => {
    const initializeAI = async () => {
      try {
        await aiService.initialize();
        self.isModelInitialized = true;
      } catch (error) {
        console.error("Error initializing AI model:", error);
        throw error;
      }
    };

    const analyzeCrop = async (cropId: string, imageUri: string) => {
      self.isAnalyzing = true;
      try {
        if (!self.isModelInitialized) {
          await initializeAI();
        }

        const result = await aiService.detectDisease(imageUri);
        
        const analysis = {
          id: String(Date.now()),
          cropId,
          disease: result.disease,
          confidence: result.confidence,
          recommendations: result.recommendations,
          timestamp: new Date()
        };

        const crop = self.getCropById(cropId);
        if (crop) {
          crop.analyses.push(analysis);
          crop.status = result.disease === "healthy" ? "healthy" : "diseased";
        }

        return analysis;
      } catch (error) {
        console.error("Error analyzing crop:", error);
        throw error;
      } finally {
        self.isAnalyzing = false;
      }
    };

    const addCrop = (crop: typeof CropModel.Type) => {
      self.crops.push(crop);
    };

    const reset = () => {
      self.crops.clear();
      self.isAnalyzing = false;
      self.isModelInitialized = false;
    };

    return {
      initializeAI,
      analyzeCrop,
      addCrop,
      reset
    };
  });

export interface CropStore extends Instance<typeof CropStoreModel> {}
export interface CropStoreSnapshot extends SnapshotOut<typeof CropStoreModel> {}
export { CropStoreModel }; 